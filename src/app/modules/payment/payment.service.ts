import { PaymentMethod, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import stripe from "../../../helpers/stripeClient";
import { HTTPError } from "../../errors/HTTPError";
import prisma from "../../../shared/prismaClient";

interface CreateSetupIntentResult {
  clientSecret: string;
  setupIntentId: string;
}

const createSetupIntent = async (
  userId: string,
  userEmail: string
): Promise<CreateSetupIntentResult> => {
  // Get or create Stripe customer
  let customer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!customer) {
    throw new HTTPError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if user already has a Stripe customer ID stored
  const existingPaymentMethod = await prisma.paymentMethod.findFirst({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  let stripeCustomerId = existingPaymentMethod?.stripeCustomerId;

  // Create Stripe customer if doesn't exist
  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        userId,
      },
    });
    stripeCustomerId = stripeCustomer.id;
  }

  // Create Setup Intent
  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
  });

  return {
    clientSecret: setupIntent.client_secret || "",
    setupIntentId: setupIntent.id,
  };
};

const attachPaymentMethod = async (
  userId: string,
  paymentMethodId: string,
  setupIntentId?: string
): Promise<PaymentMethod> => {
  // Verify the payment method exists in Stripe
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!paymentMethod || paymentMethod.type !== "card") {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Invalid payment method or not a card"
    );
  }

  // Get or create Stripe customer
  let stripeCustomerId: string | null = null;

  // If setupIntentId is provided, get customer from setup intent
  if (setupIntentId) {
    try {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (setupIntent.status !== "succeeded") {
        throw new HTTPError(
          httpStatus.BAD_REQUEST,
          "Setup intent was not successful"
        );
      }
      // Verify the payment method matches the setup intent
      if (setupIntent.payment_method !== paymentMethodId) {
        throw new HTTPError(
          httpStatus.BAD_REQUEST,
          "Payment method does not match setup intent"
        );
      }
      // Get customer ID from setup intent (it was created with a customer)
      if (setupIntent.customer && typeof setupIntent.customer === "string") {
        stripeCustomerId = setupIntent.customer;
      } else if (
        setupIntent.customer &&
        typeof setupIntent.customer === "object"
      ) {
        stripeCustomerId = setupIntent.customer.id;
      }
    } catch (error) {
      if (error instanceof HTTPError) {
        throw error;
      }
      throw new HTTPError(
        httpStatus.BAD_REQUEST,
        "Failed to verify setup intent"
      );
    }
  }

  // If we don't have a customer ID yet, check existing payment methods or create one
  if (!stripeCustomerId) {
    const existingPaymentMethod = await prisma.paymentMethod.findFirst({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    stripeCustomerId = existingPaymentMethod?.stripeCustomerId || null;

    if (!stripeCustomerId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new HTTPError(httpStatus.NOT_FOUND, "User not found");
      }

      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId,
        },
      });
      stripeCustomerId = stripeCustomer.id;
    }
  }

  // Attach payment method to customer (if not already attached)
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });
  } catch (error: any) {
    // If payment method is already attached, that's okay
    if (error?.code !== "payment_method_already_attached") {
      throw new HTTPError(
        httpStatus.BAD_REQUEST,
        error?.message || "Failed to attach payment method"
      );
    }
  }

  // Get card details
  const card = paymentMethod.card;
  if (!card) {
    throw new HTTPError(httpStatus.BAD_REQUEST, "Card details not found");
  }

  // Check if this is the first payment method (make it default)
  const existingMethods = await prisma.paymentMethod.count({
    where: { userId },
  });

  const isDefault = existingMethods === 0;

  // If this is set as default, unset all other defaults
  if (isDefault) {
    await prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Save payment method to database
  const savedPaymentMethod = await prisma.paymentMethod.create({
    data: {
      userId,
      stripePaymentMethodId: paymentMethodId,
      stripeCustomerId,
      cardLast4: card.last4 || "",
      cardBrand: card.brand || "unknown",
      cardExpMonth: card.exp_month || 0,
      cardExpYear: card.exp_year || 0,
      isDefault,
    },
  });

  return savedPaymentMethod;
};

const getAllPaymentMethods = async (
  userId: string
): Promise<PaymentMethod[]> => {
  return await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
};

const deletePaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<void> => {
  // Verify ownership
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      userId,
    },
  });

  if (!paymentMethod) {
    throw new HTTPError(
      httpStatus.NOT_FOUND,
      "Payment method not found or access denied"
    );
  }

  // Detach from Stripe customer
  try {
    await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
  } catch (error) {
    // If already detached, continue
  }

  // Delete from database
  await prisma.paymentMethod.delete({
    where: { id: paymentMethodId },
  });

  // If this was the default, set another one as default if available
  if (paymentMethod.isDefault) {
    const nextPaymentMethod = await prisma.paymentMethod.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (nextPaymentMethod) {
      await prisma.paymentMethod.update({
        where: { id: nextPaymentMethod.id },
        data: { isDefault: true },
      });
    }
  }
};

const setDefaultPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<PaymentMethod> => {
  // Verify ownership
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      userId,
    },
  });

  if (!paymentMethod) {
    throw new HTTPError(
      httpStatus.NOT_FOUND,
      "Payment method not found or access denied"
    );
  }

  // Unset all other defaults
  await prisma.paymentMethod.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  // Set this as default
  const updated = await prisma.paymentMethod.update({
    where: { id: paymentMethodId },
    data: { isDefault: true },
  });

  return updated;
};

export const PaymentService = {
  createSetupIntent,
  attachPaymentMethod,
  getAllPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
};

