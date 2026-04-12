import type {
  PaymentGateway,
  CreateCheckoutOptions,
  CheckoutSession,
  ParsedWebhookEvent,
} from './PaymentGateway';
import type { IBooking, IUser } from '@/types';

export class MockPaymentGateway implements PaymentGateway {
  readonly name = 'paymob' as const;

  async createCheckoutSession(
    booking: IBooking,
    _student: Pick<IUser, 'id' | 'email' | 'name'>,
    options?: CreateCheckoutOptions
  ): Promise<CheckoutSession> {
    const returnUrl = options?.returnUrl ?? '/student/bookings';
    const redirectUrl =
      `/api/webhooks/paymob/mock-confirm` +
      `?bookingId=${booking.id}` +
      `&returnUrl=${encodeURIComponent(returnUrl)}`;

    return {
      redirectUrl,
      providerSessionId: `mock_session_${booking.id}_${Date.now()}`,
    };
  }

  verifyWebhook(): boolean {
    return true;
  }

  parseWebhookEvent(payload: unknown): ParsedWebhookEvent {
    const data = payload as Record<string, unknown>;
    const bookingId = Number(data.bookingId ?? data.booking_id ?? 0);
    if (!bookingId) throw new Error('Mock webhook: missing bookingId');

    return {
      bookingId,
      transactionId: `mock_txn_${bookingId}_${Date.now()}`,
      success: true,
      paymentMethod: 'paymob_card',
      amount: 0,
      raw: payload,
    };
  }
}
