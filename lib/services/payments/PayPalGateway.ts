import type {
  PaymentGateway,
  CreateCheckoutOptions,
  CheckoutSession,
  ParsedWebhookEvent,
  CaptureResult,
} from './PaymentGateway';
import type { IBooking, IUser } from '@/types';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  appUrl: string;
}

interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: PayPalLink[];
}

interface PayPalPurchaseUnit {
  reference_id?: string;
  custom_id?: string;
  payments?: {
    captures?: Array<{
      id: string;
      status: string;
      amount: { currency_code: string; value: string };
      custom_id?: string;
    }>;
  };
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: PayPalPurchaseUnit[];
}

interface PayPalOrderDetailResponse {
  id: string;
  status: string;
  purchase_units: PayPalPurchaseUnit[];
}

interface PayPalErrorResponse {
  name?: string;
  message?: string;
  details?: Array<{ issue?: string; description?: string }>;
}

/**
 * PayPal hosted-checkout gateway (US launch).
 *
 * Flow:
 *   1. createCheckoutSession → POST /v2/checkout/orders (intent=CAPTURE) →
 *      returns the `approve` link. The student is redirected there.
 *   2. Student approves on PayPal, lands back on our /return page with
 *      ?token=<orderId>&PayerID=<...>.
 *   3. /return posts to /api/bookings/:id/capture/paypal which calls
 *      captureOrder() → POST /v2/checkout/orders/:orderId/capture.
 *
 * Webhooks are intentionally NOT wired for the 2-day launch — confirmation
 * is synchronous on return. verifyWebhook/parseWebhookEvent are stubs.
 */
export class PayPalGateway implements PaymentGateway {
  readonly name = 'paypal' as const;
  private config: PayPalConfig;
  private cachedAccessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: PayPalConfig) {
    this.config = config;
  }

  private get apiBase(): string {
    return this.config.environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  async createCheckoutSession(
    booking: IBooking,
    _student: Pick<IUser, 'id' | 'email' | 'name'>,
    _options?: CreateCheckoutOptions
  ): Promise<CheckoutSession> {
    const accessToken = await this.authenticate();
    const amount = Number(booking.amount).toFixed(2);
    const bookingId = booking.id;

    const returnUrl = `${this.config.appUrl}/student/bookings/${bookingId}/return`;
    const cancelUrl = `${this.config.appUrl}/student/bookings/${bookingId}/pay?cancelled=1`;

    const res = await fetch(`${this.apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: String(bookingId),
            custom_id: String(bookingId),
            invoice_id: `mihraby-${bookingId}-${Date.now()}`,
            amount: {
              currency_code: 'USD',
              value: amount,
            },
          },
        ],
        application_context: {
          brand_name: 'Mihraby',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as PayPalErrorResponse;
      throw new Error(
        `PayPal order creation failed (${res.status}): ${errBody.message ?? 'unknown'}`
      );
    }

    const order = (await res.json()) as PayPalOrderResponse;
    const approveLink = order.links.find((l) => l.rel === 'approve');
    if (!approveLink) {
      throw new Error('PayPal order response missing `approve` link');
    }

    return {
      redirectUrl: approveLink.href,
      providerSessionId: order.id,
    };
  }

  async captureOrder(orderId: string, bookingId: number): Promise<CaptureResult> {
    const accessToken = await this.authenticate();

    const res = await fetch(`${this.apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = body as PayPalErrorResponse;
      const issue = err.details?.[0]?.issue ?? err.name ?? '';

      // Idempotent replay: PayPal rejects duplicate capture attempts. Instead
      // of trusting the error body, re-fetch the order and return the real
      // capture details (id + amount) after verifying reference_id matches
      // the target bookingId. This closes the cross-booking order-ID replay
      // path: a student cannot confirm booking B by replaying booking A's
      // already-captured order id.
      if (issue === 'ORDER_ALREADY_CAPTURED') {
        return this.fetchExistingCapture(orderId, bookingId, accessToken);
      }

      throw new Error(
        `PayPal capture failed (${res.status}): ${issue || err.message || 'unknown'}`
      );
    }

    const capture = body as PayPalCaptureResponse;
    const unit = capture.purchase_units?.[0];
    const firstCapture = unit?.payments?.captures?.[0];

    if (!firstCapture || firstCapture.status !== 'COMPLETED') {
      throw new Error(
        `PayPal capture returned non-COMPLETED status: ${firstCapture?.status ?? 'missing'}`
      );
    }

    this.assertCaptureBinding(unit, firstCapture.amount.currency_code, bookingId);

    return {
      success: true,
      transactionId: firstCapture.id,
      amount: Number(firstCapture.amount.value),
      raw: body,
    };
  }

  /**
   * Idempotent replay path: the order was already captured (possibly from a
   * previous /return-page retry). Fetch the order to recover the real capture
   * id and amount, and verify the stored reference_id/custom_id matches the
   * target bookingId so a student cannot confirm one booking using another
   * booking's order id.
   */
  private async fetchExistingCapture(
    orderId: string,
    bookingId: number,
    accessToken: string
  ): Promise<CaptureResult> {
    const res = await fetch(`${this.apiBase}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `PayPal order fetch failed after ORDER_ALREADY_CAPTURED (${res.status})`
      );
    }

    const order = body as PayPalOrderDetailResponse;
    const unit = order.purchase_units?.[0];
    const firstCapture = unit?.payments?.captures?.[0];

    if (!firstCapture || firstCapture.status !== 'COMPLETED') {
      throw new Error(
        `PayPal order lookup returned non-COMPLETED capture status: ${firstCapture?.status ?? 'missing'}`
      );
    }

    this.assertCaptureBinding(unit, firstCapture.amount.currency_code, bookingId);

    return {
      success: true,
      transactionId: firstCapture.id,
      amount: Number(firstCapture.amount.value),
      raw: body,
    };
  }

  private assertCaptureBinding(
    unit: PayPalPurchaseUnit | undefined,
    currencyCode: string,
    bookingId: number
  ): void {
    const expected = String(bookingId);
    const refId = unit?.reference_id;
    const customId = unit?.custom_id ?? unit?.payments?.captures?.[0]?.custom_id;

    if (refId !== expected && customId !== expected) {
      throw new Error(
        `PayPal capture reference_id/custom_id mismatch: expected '${expected}', got reference_id='${refId ?? ''}' custom_id='${customId ?? ''}'`
      );
    }

    if (currencyCode !== 'USD') {
      throw new Error(
        `PayPal capture currency mismatch: expected 'USD', got '${currencyCode}'`
      );
    }
  }

  verifyWebhook(
    _rawBody: string,
    _headers: Record<string, string | string[] | undefined>
  ): boolean {
    // Intentionally not implemented — launch flow is synchronous capture.
    // Post-launch: add PayPal webhook verification via transmission signature.
    return false;
  }

  parseWebhookEvent(_payload: unknown): ParsedWebhookEvent {
    throw new Error(
      'PayPalGateway.parseWebhookEvent: webhooks are not wired yet (post-launch follow-up)'
    );
  }

  private async authenticate(): Promise<string> {
    if (this.cachedAccessToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedAccessToken;
    }

    const basic = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      throw new Error(`PayPal auth failed: ${res.status}`);
    }

    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedAccessToken = body.access_token;
    // Refresh 60s before actual expiry.
    this.tokenExpiresAt = Date.now() + Math.max(60, body.expires_in - 60) * 1000;
    return body.access_token;
  }
}
