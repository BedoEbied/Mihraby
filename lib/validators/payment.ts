import { z } from 'zod';

export const paymobPayMethodSchema = z.enum(['paymob_card', 'paymob_wallet', 'paymob_fawry']);

export const createCheckoutSchema = z.object({
  payment_method: paymobPayMethodSchema,
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
