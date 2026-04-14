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

interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
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

  async captureOrder(orderId: string, _bookingId: number): Promise<CaptureResult> {
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

      // Idempotency: PayPal rejects duplicate capture attempts. Treat as success.
      if (issue === 'ORDER_ALREADY_CAPTURED') {
        return {
          success: true,
          transactionId: orderId,
          amount: 0,
          raw: body,
        };
      }

      throw new Error(
        `PayPal capture failed (${res.status}): ${issue || err.message || 'unknown'}`
      );
    }

    const capture = body as PayPalCaptureResponse;
    const firstCapture = capture.purchase_units?.[0]?.payments?.captures?.[0];

    if (!firstCapture || firstCapture.status !== 'COMPLETED') {
      throw new Error(
        `PayPal capture returned non-COMPLETED status: ${firstCapture?.status ?? 'missing'}`
      );
    }

    return {
      success: true,
      transactionId: firstCapture.id,
      amount: Number(firstCapture.amount.value),
      raw: body,
    };
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
