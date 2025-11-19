import { z } from "zod";

const createSetupIntent = z.object({
  body: z.any().optional(),
});

const attachPaymentMethod = z.object({
  body: z.object({
    paymentMethodId: z.string().min(1, "Payment method ID is required"),
    setupIntentId: z.string().optional(),
  }),
});

const setDefault = z.object({
  body: z.any().optional(),
});

export const paymentValidationSchemas = {
  createSetupIntent,
  attachPaymentMethod,
  setDefault,
};

