import crypto from 'crypto';
import type {
  PaymentGateway,
  CreateCheckoutOptions,
  CheckoutSession,
  ParsedWebhookEvent,
} from './PaymentGateway';
import type { IBooking, IUser, PaymentMethod } from '@/types';

interface PaymobConfig {
  apiKey: string;
  integrationIds: { card: string; wallet: string; fawry: string };
  iframeId: string;
  hmacSecret: string;
}

const PAYMOB_BASE = 'https://accept.paymob.com/api';

export class PaymobGateway implements PaymentGateway {
  readonly name = 'paymob' as const;
  private config: PaymobConfig;
  private cachedAuthToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: PaymobConfig) {
    this.config = config;
  }

  async createCheckoutSession(
    booking: IBooking,
    student: Pick<IUser, 'id' | 'email' | 'name'>,
    options?: CreateCheckoutOptions
  ): Promise<CheckoutSession> {
    const authToken = await this.authenticate();
    const amountPiasters = Math.round(Number(booking.amount) * 100);
    const method = options?.method ?? 'paymob_card';

    const order = await this.registerOrder(authToken, {
      amount_cents: amountPiasters,
      currency: 'EGP',
      merchant_order_id: String(booking.id),
    });

    const integrationId = this.integrationIdFor(method);
    const paymentKey = await this.createPaymentKey(authToken, {
      order_id: order.id,
      amount_cents: amountPiasters,
      currency: 'EGP',
      integration_id: Number(integrationId),
      billing_data: {
        first_name: student.name.split(' ')[0] || 'N/A',
        last_name: student.name.split(' ').slice(1).join(' ') || 'N/A',
        email: student.email,
        phone_number: 'N/A',
        street: 'N/A',
        building: 'N/A',
        floor: 'N/A',
        apartment: 'N/A',
        city: 'N/A',
        country: 'EG',
        state: 'N/A',
        zip_code: 'N/A',
        shipping_method: 'N/A',
      },
    });

    const redirectUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;

    return {
      redirectUrl,
      providerSessionId: String(order.id),
    };
  }

  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): boolean {
    const receivedHmac = headers['hmac'] as string | undefined;
    if (!receivedHmac) return false;

    const data = JSON.parse(rawBody);
    const obj = data.obj ?? data;

    const concatenated = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id ?? obj.order,
      obj.owner,
      obj.pending,
      obj.source_data?.pan ?? '',
      obj.source_data?.sub_type ?? '',
      obj.source_data?.type ?? '',
      obj.success,
    ].join('');

    const computed = crypto
      .createHmac('sha512', this.config.hmacSecret)
      .update(concatenated)
      .digest('hex');

    const computedBuf = Buffer.from(computed, 'hex');
    const receivedBuf = Buffer.from(receivedHmac, 'hex');

    if (computedBuf.length !== receivedBuf.length) return false;

    return crypto.timingSafeEqual(computedBuf, receivedBuf);
  }

  parseWebhookEvent(payload: unknown): ParsedWebhookEvent {
    const data = payload as Record<string, any>;
    const obj = data.obj ?? data;

    const merchantOrderId = obj.order?.merchant_order_id
      ?? obj.merchant_order_id
      ?? String(obj.order?.id ?? '');
    const bookingId = Number(merchantOrderId);
    if (!bookingId || !Number.isFinite(bookingId)) {
      throw new Error(`Cannot extract bookingId from webhook payload: ${merchantOrderId}`);
    }

    return {
      bookingId,
      transactionId: String(obj.id),
      success: Boolean(obj.success),
      paymentMethod: this.detectMethod(obj),
      amount: Number(obj.amount_cents ?? 0) / 100,
      raw: payload,
    };
  }

  private async authenticate(): Promise<string> {
    if (this.cachedAuthToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedAuthToken;
    }
    const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.config.apiKey }),
    });
    if (!res.ok) throw new Error(`Paymob auth failed: ${res.status}`);
    const body = await res.json();
    this.cachedAuthToken = body.token;
    this.tokenExpiresAt = Date.now() + 50 * 60 * 1000;
    return body.token;
  }

  private async registerOrder(
    authToken: string,
    data: { amount_cents: number; currency: string; merchant_order_id: string }
  ): Promise<{ id: number }> {
    const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_token: authToken, delivery_needed: false, ...data, items: [] }),
    });
    if (!res.ok) throw new Error(`Paymob order registration failed: ${res.status}`);
    return res.json();
  }

  private async createPaymentKey(
    authToken: string,
    data: {
      order_id: number;
      amount_cents: number;
      currency: string;
      integration_id: number;
      billing_data: Record<string, string>;
    }
  ): Promise<string> {
    const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_token: authToken, ...data, expiration: 3600, lock_order_when_paid: true }),
    });
    if (!res.ok) throw new Error(`Paymob payment key creation failed: ${res.status}`);
    const body = await res.json();
    return body.token;
  }

  private integrationIdFor(method: PaymentMethod): string {
    switch (method) {
      case 'paymob_card': return this.config.integrationIds.card;
      case 'paymob_wallet': return this.config.integrationIds.wallet;
      case 'paymob_fawry': return this.config.integrationIds.fawry;
      default: return this.config.integrationIds.card;
    }
  }

  private detectMethod(obj: Record<string, any>): PaymentMethod {
    const subType = obj.source_data?.sub_type?.toLowerCase() ?? '';
    if (subType.includes('wallet')) return 'paymob_wallet';
    if (subType.includes('fawry')) return 'paymob_fawry';
    return 'paymob_card';
  }
}
