import type { IBooking, IUser, PaymentMethod } from '@/types';

/**
 * Abstraction over a hosted payment gateway (Paymob, Kashier, etc.).
 *
 * Concrete implementations:
 *   - PaymobGateway (Phase 3) — active for MVP
 *
 * To swap gateways, add a new implementation and change the wiring in
 * `lib/composition.ts`. Routes depend only on this interface.
 */
export interface PaymentGateway {
  /**
   * Human-readable name used in logs and error messages.
   */
  readonly name: 'paymob' | 'kashier' | 'paypal';

  /**
   * Create a hosted checkout session for the given booking and return the URL
   * the student should be redirected to. Implementations are responsible for
   * any intermediate calls to the gateway (auth, order creation, intention,
   * payment key, etc.).
   *
   * Amount handling (piasters / cents / etc.) MUST be contained inside the
   * implementation — callers always work in major currency units (EGP).
   */
  createCheckoutSession(
    booking: IBooking,
    student: Pick<IUser, 'id' | 'email' | 'name'>,
    options?: CreateCheckoutOptions
  ): Promise<CheckoutSession>;

  /**
   * Verify a webhook request is authentic (HMAC / signature).
   *
   * IMPLEMENTATION NOTE: the caller passes the RAW body string, not a parsed
   * JSON object. In Next.js App Router, always use `await req.text()` before
   * parsing so HMAC can be computed over the original bytes.
   */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): boolean;

  /**
   * Parse a verified webhook payload into a normalized event the booking
   * service can act on. Throws if the payload is malformed.
   */
  parseWebhookEvent(payload: unknown): ParsedWebhookEvent;

  /**
   * Optional: capture a previously authorized order. Used by hosted-checkout
   * providers (e.g. PayPal) that confirm payment synchronously on return
   * rather than via an async webhook. Gateways that confirm via webhook
   * should leave this undefined.
   */
  captureOrder?(orderId: string, bookingId: number): Promise<CaptureResult>;
}

export interface CaptureResult {
  /** True if PayPal reported the capture as COMPLETED. */
  success: boolean;
  /** Gateway-specific transaction id to store on the booking. */
  transactionId: string;
  /** Captured amount in major currency units (USD). */
  amount: number;
  /** Raw gateway response for logging / debugging. */
  raw: unknown;
}

export interface CreateCheckoutOptions {
  /**
   * Which specific payment method the student selected. A single gateway
   * may expose multiple rails (card vs. wallet vs. Fawry) as different
   * integration IDs, so the implementation needs to know which one to pick.
   */
  method: Extract<PaymentMethod, 'paymob_card' | 'paymob_wallet' | 'paymob_fawry' | 'paypal'>;
  /**
   * URL the gateway should redirect the student to after payment completes
   * (regardless of success/failure). Typically our `/booking/[id]/return` page.
   */
  returnUrl: string;
}

export interface CheckoutSession {
  /** URL the student is redirected to in order to complete payment. */
  redirectUrl: string;
  /**
   * Opaque identifier from the gateway. Stored on the booking so we can
   * correlate webhook events back to the originating session.
   */
  providerSessionId: string;
}

export interface ParsedWebhookEvent {
  /** Our booking id, recovered from the gateway's merchant_order_id / reference. */
  bookingId: number;
  /** Gateway's own transaction id. Used as idempotency key. */
  transactionId: string;
  /** True if the payment succeeded, false if it failed/was declined. */
  success: boolean;
  /** Which specific method the student used (card, wallet, Fawry). */
  paymentMethod: PaymentMethod;
  /** Amount captured in major currency units (EGP). */
  amount: number;
  /** Gateway-specific raw payload for logging / debugging. */
  raw: unknown;
}
