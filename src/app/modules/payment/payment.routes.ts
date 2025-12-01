import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
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

// Milestone payment routes
router.post(
  "/milestones/:milestoneId/process",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.processMilestonePayment),
  PaymentController.processMilestonePayment
);

router.get(
  "/milestones/:milestoneId/payments",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.getMilestonePayments),
  PaymentController.getMilestonePayments
);

router.get(
  "/payments",
  roleGuard("CLIENT"),
  PaymentController.getUserPayments
);

router.get(
  "/payments/:paymentId/invoice",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.getPaymentInvoice),
  PaymentController.getPaymentInvoice
);

// Admin manual payment route
router.post(
  "/milestones/:milestoneId/mark-paid-manually",
  permissionGuard("manage_manual_payment"),
  validateRequest(paymentValidationSchemas.markMilestoneAsPaidManually),
  PaymentController.markMilestoneAsPaidManually
);

export const PaymentRoutes = router;



