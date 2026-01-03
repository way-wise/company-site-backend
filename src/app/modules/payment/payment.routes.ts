import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";
import { paymentValidationSchemas } from "./payment.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/payment/setup-intent:
 *   post:
 *     tags: [Payment]
 *     summary: Create setup intent
 *     description: Create a Stripe setup intent for saving payment methods. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Setup intent created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - CLIENT role required
 */
router.post(
  "/setup-intent",
  roleGuard("CLIENT"),
  validateRequest(paymentValidationSchemas.createSetupIntent),
  PaymentController.createSetupIntent
);

/**
 * @swagger
 * /api/v1/payment/payment-methods:
 *   post:
 *     tags: [Payment]
 *     summary: Attach payment method
 *     description: Attach a payment method to user account. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - setupIntentId
 *             properties:
 *               setupIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment method attached successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Payment]
 *     summary: Get all payment methods
 *     description: Get all payment methods for the authenticated user. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Payment methods fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/payment/payment-methods/{id}:
 *   delete:
 *     tags: [Payment]
 *     summary: Delete payment method
 *     description: Delete a payment method. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment method not found
 * /api/v1/payment/payment-methods/{id}/set-default:
 *   patch:
 *     tags: [Payment]
 *     summary: Set default payment method
 *     description: Set a payment method as default. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default payment method set successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment method not found
 * /api/v1/payment/milestones/{milestoneId}/process:
 *   post:
 *     tags: [Payment]
 *     summary: Process milestone payment
 *     description: Process payment for a milestone. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/payment/milestones/{milestoneId}/payments:
 *   get:
 *     tags: [Payment]
 *     summary: Get milestone payments
 *     description: Get all payments for a milestone. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/payment/payments:
 *   get:
 *     tags: [Payment]
 *     summary: Get user payments
 *     description: Get all payments for the authenticated user. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/payment/payments/{paymentId}/invoice:
 *   get:
 *     tags: [Payment]
 *     summary: Get payment invoice
 *     description: Get invoice for a payment. Requires CLIENT role.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 * /api/v1/payment/milestones/{milestoneId}/mark-paid-manually:
 *   post:
 *     tags: [Payment]
 *     summary: Mark milestone as paid manually (Admin)
 *     description: Mark a milestone as paid manually. Requires 'manage_manual_payment' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manualPaymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Milestone marked as paid successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

router.post(
  "/milestones/:milestoneId/mark-paid-manually",
  permissionGuard("manage_manual_payment"),
  validateRequest(paymentValidationSchemas.markMilestoneAsPaidManually),
  PaymentController.markMilestoneAsPaidManually
);

export const PaymentRoutes = router;



