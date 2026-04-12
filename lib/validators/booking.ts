import { z } from 'zod';

const paymentMethodEnum = z.enum(['paymob_card', 'paymob_wallet', 'paymob_fawry', 'instapay']);

export const initiateBookingSchema = z.object({
  slot_id: z.number().int().positive('Slot ID is required'),
  payment_method: paymentMethodEnum,
});

export const createPaymentSchema = z.object({
  booking_id: z.number().int().positive(),
  amount: z.number().positive(),
  email: z.string().email(),
  phone: z.string().min(10),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']),
});

export const bookingIdSchema = z.object({
  id: z.coerce.number().int().min(1, 'Invalid booking ID'),
});

export type InitiateBookingInput = z.infer<typeof initiateBookingSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
