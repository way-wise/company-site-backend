import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";
import { paymentValidationSchemas } from "./payment.validationSchema";

const router = express.Router();

// All routes require CLIENT role
router.post(
  "/setup-intent",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.createSetupIntent),
  PaymentController.createSetupIntent
);

router.post(
  "/payment-methods",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.attachPaymentMethod),
  PaymentController.attachPaymentMethod
);

router.get(
  "/payment-methods",
  roleGuard("CLIENT"),
  PaymentController.getAllPaymentMethods
);

router.delete(
  "/payment-methods/:id",
  roleGuard("CLIENT"),
  PaymentController.deletePaymentMethod
);

router.patch(
  "/payment-methods/:id/set-default",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.setDefault),
  PaymentController.setDefaultPaymentMethod
);

export const PaymentRoutes = router;



