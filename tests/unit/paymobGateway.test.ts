import { afterEach, describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

const HMAC_SECRET = 'test_hmac_secret_key';

function makeConfig() {
  return {
    apiKey: 'test_api_key',
    integrationIds: { card: '100', wallet: '200', fawry: '300' },
    iframeId: '999',
    hmacSecret: HMAC_SECRET,
  };
}

function makeWebhookObj(overrides: Record<string, unknown> = {}) {
  return {
    amount_cents: 15000,
    created_at: '2026-04-12T12:00:00',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    id: 12345,
    integration_id: 100,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 99, merchant_order_id: '42' },
    owner: 1,
    pending: false,
    source_data: { pan: '1234', sub_type: 'MasterCard', type: 'card' },
    success: true,
    ...overrides,
  };
}

function computeHmac(obj: ReturnType<typeof makeWebhookObj>): string {
  const concatenated = [
    obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
    obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
    obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
    obj.is_voided, obj.order?.id ?? obj.order, obj.owner, obj.pending,
    obj.source_data?.pan ?? '', obj.source_data?.sub_type ?? '',
    obj.source_data?.type ?? '', obj.success,
  ].join('');
  return crypto.createHmac('sha512', HMAC_SECRET).update(concatenated).digest('hex');
}

const { PaymobGateway } = await import('@/lib/services/payments/PaymobGateway');

describe('PaymobGateway', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyWebhook', () => {
    it('returns true for valid HMAC', () => {
      const gateway = new PaymobGateway(makeConfig());
      const obj = makeWebhookObj();
      const rawBody = JSON.stringify({ obj });
      const hmac = computeHmac(obj);
      expect(gateway.verifyWebhook(rawBody, { hmac })).toBe(true);
    });

    it('returns false for invalid HMAC', () => {
      const gateway = new PaymobGateway(makeConfig());
      const obj = makeWebhookObj();
      const rawBody = JSON.stringify({ obj });
      expect(gateway.verifyWebhook(rawBody, { hmac: 'bad_hmac_value'.padEnd(128, '0') })).toBe(false);
    });

    it('returns false when hmac header is missing', () => {
      const gateway = new PaymobGateway(makeConfig());
      expect(gateway.verifyWebhook('{}', {})).toBe(false);
    });
  });

  describe('parseWebhookEvent', () => {
    it('extracts bookingId from merchant_order_id', () => {
      const gateway = new PaymobGateway(makeConfig());
      const event = gateway.parseWebhookEvent({ obj: makeWebhookObj() });
      expect(event.bookingId).toBe(42);
      expect(event.transactionId).toBe('12345');
      expect(event.success).toBe(true);
      expect(event.amount).toBe(150);
    });

    it('detects wallet payment method', () => {
      const gateway = new PaymobGateway(makeConfig());
      const obj = makeWebhookObj({ source_data: { pan: '', sub_type: 'WALLET', type: 'wallet' } });
      expect(gateway.parseWebhookEvent({ obj }).paymentMethod).toBe('paymob_wallet');
    });

    it('detects fawry payment method', () => {
      const gateway = new PaymobGateway(makeConfig());
      const obj = makeWebhookObj({ source_data: { pan: '', sub_type: 'FAWRY', type: 'fawry' } });
      expect(gateway.parseWebhookEvent({ obj }).paymentMethod).toBe('paymob_fawry');
    });

    it('throws when bookingId cannot be extracted', () => {
      const gateway = new PaymobGateway(makeConfig());
      expect(() =>
        gateway.parseWebhookEvent({ obj: { ...makeWebhookObj(), order: { id: 1, merchant_order_id: '' } } })
      ).toThrow('Cannot extract bookingId');
    });

    it('reports failed payment', () => {
      const gateway = new PaymobGateway(makeConfig());
      const obj = makeWebhookObj({ success: false });
      expect(gateway.parseWebhookEvent({ obj }).success).toBe(false);
    });
  });

  describe('piasters conversion', () => {
    it('converts booking amounts to piasters when creating checkout sessions', async () => {
      const gateway = new PaymobGateway(makeConfig());
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'auth_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 987 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'payment_key' }),
        });
      vi.stubGlobal('fetch', fetchMock);

      await gateway.createCheckoutSession(
        {
          id: 42,
          user_id: 7,
          course_id: 10,
          slot_id: 3,
          payment_status: 'pending',
          payment_method: 'paymob_card',
          payment_id: null,
          transaction_id: null,
          amount: 250,
          meeting_link: null,
          meeting_id: null,
          meeting_platform: 'zoom',
          status: 'pending_payment',
          booked_at: new Date('2026-04-12T12:00:00Z'),
          cancelled_at: null,
          instapay_reference: null,
          payment_proof_path: null,
          payment_proof_uploaded_at: null,
          admin_notes: null,
        },
        { id: 7, email: 'student@example.com', name: 'Student Example' }
      );

      const registerOrderCall = fetchMock.mock.calls[1];
      const payload = JSON.parse(registerOrderCall[1].body as string);
      expect(payload.amount_cents).toBe(25000);
    });
  });
});
