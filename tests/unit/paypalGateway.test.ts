import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { PayPalGateway } from '@/lib/services/payments/PayPalGateway';
import type { IBooking, IUser } from '@/types';

function makeGateway() {
  return new PayPalGateway({
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret',
    environment: 'sandbox',
    appUrl: 'https://example.test',
  });
}

function makeBooking(overrides: Partial<IBooking> = {}): IBooking {
  return {
    id: 42,
    user_id: 1,
    course_id: 7,
    slot_id: 99,
    payment_status: 'pending',
    payment_method: 'paypal',
    payment_id: null,
    transaction_id: null,
    amount: 15.5,
    meeting_link: null,
    meeting_id: null,
    meeting_platform: 'manual',
    status: 'pending_payment',
    booked_at: new Date('2026-04-14T00:00:00Z'),
    cancelled_at: null,
    instapay_reference: null,
    payment_proof_path: null,
    payment_proof_uploaded_at: null,
    ...overrides,
  } as IBooking;
}

const STUDENT: Pick<IUser, 'id' | 'email' | 'name'> = {
  id: 1,
  email: 'student@example.test',
  name: 'Test Student',
};

function mockFetchSequence(responses: Array<{ ok: boolean; status?: number; body: unknown }>) {
  const fetchMock = vi.fn();
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 400),
      json: async () => r.body,
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PayPalGateway.createCheckoutSession', () => {
  it('authenticates, posts an order with USD amount + return_url, and returns the approve link', async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, body: { access_token: 'TOKEN_ABC', expires_in: 3600 } },
      {
        ok: true,
        body: {
          id: 'ORDER_001',
          status: 'CREATED',
          links: [
            { href: 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER_001', rel: 'approve', method: 'GET' },
            { href: 'https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER_001', rel: 'self', method: 'GET' },
          ],
        },
      },
    ]);

    const gateway = makeGateway();
    const result = await gateway.createCheckoutSession(makeBooking({ id: 42, amount: 15.5 }), STUDENT);

    expect(result.providerSessionId).toBe('ORDER_001');
    expect(result.redirectUrl).toContain('checkoutnow?token=ORDER_001');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [authUrl, authInit] = fetchMock.mock.calls[0];
    expect(authUrl).toBe('https://api-m.sandbox.paypal.com/v1/oauth2/token');
    expect(authInit.body).toBe('grant_type=client_credentials');
    expect(authInit.headers.Authorization).toMatch(/^Basic /);

    const [orderUrl, orderInit] = fetchMock.mock.calls[1];
    expect(orderUrl).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
    expect(orderInit.headers.Authorization).toBe('Bearer TOKEN_ABC');

    const orderBody = JSON.parse(orderInit.body);
    expect(orderBody.intent).toBe('CAPTURE');
    expect(orderBody.purchase_units[0].amount).toEqual({
      currency_code: 'USD',
      value: '15.50',
    });
    expect(orderBody.purchase_units[0].custom_id).toBe('42');
    expect(orderBody.application_context.return_url).toBe(
      'https://example.test/student/bookings/42/return'
    );
    expect(orderBody.application_context.cancel_url).toBe(
      'https://example.test/student/bookings/42/pay?cancelled=1'
    );
    expect(orderBody.application_context.shipping_preference).toBe('NO_SHIPPING');
  });

  it('throws when the order response has no approve link', async () => {
    mockFetchSequence([
      { ok: true, body: { access_token: 'T', expires_in: 3600 } },
      { ok: true, body: { id: 'ORDER_X', status: 'CREATED', links: [{ href: 'x', rel: 'self', method: 'GET' }] } },
    ]);

    const gateway = makeGateway();
    await expect(gateway.createCheckoutSession(makeBooking(), STUDENT)).rejects.toThrow(/approve.*link/i);
  });

  it('throws when PayPal returns non-2xx on order creation', async () => {
    mockFetchSequence([
      { ok: true, body: { access_token: 'T', expires_in: 3600 } },
      { ok: false, status: 422, body: { name: 'UNPROCESSABLE_ENTITY', message: 'bad amount' } },
    ]);

    const gateway = makeGateway();
    await expect(gateway.createCheckoutSession(makeBooking(), STUDENT)).rejects.toThrow(/PayPal order creation failed.*422/);
  });
});

describe('PayPalGateway.captureOrder', () => {
  it('returns success with capture id and amount on COMPLETED', async () => {
    mockFetchSequence([
      { ok: true, body: { access_token: 'T', expires_in: 3600 } },
      {
        ok: true,
        body: {
          id: 'ORDER_001',
          status: 'COMPLETED',
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: 'CAPTURE_ABC',
                    status: 'COMPLETED',
                    amount: { currency_code: 'USD', value: '15.50' },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);

    const gateway = makeGateway();
    const result = await gateway.captureOrder('ORDER_001', 42);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('CAPTURE_ABC');
    expect(result.amount).toBe(15.5);
  });

  it('treats ORDER_ALREADY_CAPTURED as success (idempotent)', async () => {
    mockFetchSequence([
      { ok: true, body: { access_token: 'T', expires_in: 3600 } },
      {
        ok: false,
        status: 422,
        body: {
          name: 'UNPROCESSABLE_ENTITY',
          message: 'Order already captured',
          details: [{ issue: 'ORDER_ALREADY_CAPTURED', description: 'Order already captured' }],
        },
      },
    ]);

    const gateway = makeGateway();
    const result = await gateway.captureOrder('ORDER_001', 42);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('ORDER_001');
  });

  it('throws on INSTRUMENT_DECLINED', async () => {
    mockFetchSequence([
      { ok: true, body: { access_token: 'T', expires_in: 3600 } },
      {
        ok: false,
        status: 422,
        body: {
          name: 'UNPROCESSABLE_ENTITY',
          message: 'Instrument declined',
          details: [{ issue: 'INSTRUMENT_DECLINED', description: 'Card declined' }],
        },
      },
    ]);

    const gateway = makeGateway();
    await expect(gateway.captureOrder('ORDER_001', 42)).rejects.toThrow(/INSTRUMENT_DECLINED/);
  });

  it('throws when capture returns non-COMPLETED status', async () => {
    mockFetchSequence([
      { ok: true, body: { access_token: 'T', expires_in: 3600 } },
      {
        ok: true,
        body: {
          id: 'ORDER_001',
          status: 'PENDING',
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: 'CAPTURE_X', status: 'PENDING', amount: { currency_code: 'USD', value: '1.00' } },
                ],
              },
            },
          ],
        },
      },
    ]);

    const gateway = makeGateway();
    await expect(gateway.captureOrder('ORDER_001', 42)).rejects.toThrow(/non-COMPLETED status/);
  });
});

describe('PayPalGateway webhooks (deferred)', () => {
  it('verifyWebhook returns false (not implemented for launch)', () => {
    const gateway = makeGateway();
    expect(gateway.verifyWebhook('{}', {})).toBe(false);
  });

  it('parseWebhookEvent throws (not implemented for launch)', () => {
    const gateway = makeGateway();
    expect(() => gateway.parseWebhookEvent({})).toThrow(/not wired/i);
  });
});
