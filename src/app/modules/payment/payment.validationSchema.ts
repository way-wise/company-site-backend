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

const processMilestonePayment = z.object({
  params: z.object({
    milestoneId: z.string().min(1, "Milestone ID is required"),
  }),
});

const getMilestonePayments = z.object({
  params: z.object({
    milestoneId: z.string().min(1, "Milestone ID is required"),
  }),
});

const getPaymentInvoice = z.object({
  params: z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
  }),
});

const markMilestoneAsPaidManually = z.object({
  params: z.object({
    milestoneId: z.string().min(1, "Milestone ID is required"),
  }),
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
    paidAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    manualPaymentMethod: z.string().min(1, "Payment method is required"),
    notes: z.string().optional(),
  }),
});

export const paymentValidationSchemas = {
  createSetupIntent,
  attachPaymentMethod,
  setDefault,
  processMilestonePayment,
  getMilestonePayments,
  getPaymentInvoice,
  markMilestoneAsPaidManually,
};

