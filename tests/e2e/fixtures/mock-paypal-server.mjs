#!/usr/bin/env node
/**
 * Mock PayPal REST API server for E2E tests.
 *
 * Playwright cannot intercept server-side Node fetch from the Next.js process
 * (page.route() only sees browser requests), so we point PayPalGateway at
 * this local server via PAYPAL_API_BASE while the suite runs.
 *
 * Endpoints implemented (the subset PayPalGateway uses):
 *   POST /v1/oauth2/token                          → access token
 *   POST /v2/checkout/orders                       → create order, derives
 *                                                    bookingId from the
 *                                                    purchase_units[0]
 *                                                    reference_id in the body
 *   POST /v2/checkout/orders/:id/capture           → first call: COMPLETED;
 *                                                    subsequent: 422
 *                                                    ORDER_ALREADY_CAPTURED
 *   GET  /v2/checkout/orders/:id                   → order detail (used by
 *                                                    the gateway's fallback
 *                                                    after ORDER_ALREADY_CAPTURED)
 *
 * Launched by playwright.config.ts as part of the `webServer` array, on
 * MOCK_PAYPAL_PORT (default 3001).
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_PAYPAL_PORT || 3001);
const APP_URL = process.env.MOCK_PAYPAL_APP_URL || 'http://localhost:3000';

/** @type {Map<string, { bookingId: number; captured: boolean; captureId: string; amount: string }>} */
const orders = new Map();

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function buildCompletedOrder(orderId, state) {
  return {
    id: orderId,
    status: 'COMPLETED',
    purchase_units: [
      {
        reference_id: String(state.bookingId),
        custom_id: String(state.bookingId),
        payments: {
          captures: [
            {
              id: state.captureId,
              status: 'COMPLETED',
              amount: { currency_code: 'USD', value: state.amount },
            },
          ],
        },
      },
    ],
  };
}

const server = http.createServer(async (req, res) => {
  const { url, method } = req;
  const body = await readBody(req);

  if (method === 'POST' && url === '/v1/oauth2/token') {
    return sendJson(res, 200, { access_token: 'TOKEN_ABC', expires_in: 3600 });
  }

  if (method === 'POST' && url === '/v2/checkout/orders') {
    const parsed = body ? JSON.parse(body) : {};
    const unit = parsed?.purchase_units?.[0] ?? {};
    const bookingId = Number(unit.reference_id);
    const amount = unit?.amount?.value ?? '0.00';
    if (!Number.isFinite(bookingId)) {
      return sendJson(res, 400, { name: 'INVALID_REQUEST', message: 'missing reference_id' });
    }
    const orderId = `ORDER_${bookingId}_${Date.now()}`;
    orders.set(orderId, {
      bookingId,
      captured: false,
      captureId: `CAPTURE_${bookingId}`,
      amount,
    });
    return sendJson(res, 201, {
      id: orderId,
      status: 'CREATED',
      links: [
        {
          // Loop the browser straight back to our return page; no real PayPal
          // UI is ever visited. Mirrors what the live approve link would
          // eventually 302 to after the student clicks Pay Now.
          href: `${APP_URL}/student/bookings/${bookingId}/return?token=${orderId}&PayerID=PAYER_E2E`,
          rel: 'approve',
          method: 'GET',
        },
        {
          href: `http://127.0.0.1:${PORT}/v2/checkout/orders/${orderId}`,
          rel: 'self',
          method: 'GET',
        },
      ],
    });
  }

  const captureMatch = url && url.match(/^\/v2\/checkout\/orders\/([^/]+)\/capture$/);
  if (method === 'POST' && captureMatch) {
    const orderId = decodeURIComponent(captureMatch[1]);
    const state = orders.get(orderId);
    if (!state) return sendJson(res, 404, { name: 'RESOURCE_NOT_FOUND', message: 'Order not found' });
    if (state.captured) {
      return sendJson(res, 422, {
        name: 'UNPROCESSABLE_ENTITY',
        message: 'Order already captured',
        details: [{ issue: 'ORDER_ALREADY_CAPTURED', description: 'Order already captured' }],
      });
    }
    state.captured = true;
    return sendJson(res, 201, buildCompletedOrder(orderId, state));
  }

  const getMatch = url && url.match(/^\/v2\/checkout\/orders\/([^/]+)$/);
  if (method === 'GET' && getMatch) {
    const orderId = decodeURIComponent(getMatch[1]);
    const state = orders.get(orderId);
    if (!state) return sendJson(res, 404, { name: 'RESOURCE_NOT_FOUND' });
    return sendJson(res, 200, buildCompletedOrder(orderId, state));
  }

  sendJson(res, 404, { name: 'RESOURCE_NOT_FOUND', message: `no mock for ${method} ${url}` });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-paypal] listening on http://127.0.0.1:${PORT} (app url=${APP_URL})`);
});

// Graceful shutdown so Playwright's webServer teardown completes promptly.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
  });
}
