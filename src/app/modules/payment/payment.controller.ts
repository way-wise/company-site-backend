import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const createSetupIntent = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

  const result = await PaymentService.createSetupIntent(userId, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Setup intent created successfully",
    data: result,
  });
});

const attachPaymentMethod = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const { paymentMethodId, setupIntentId } = req.body;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

  const result = await PaymentService.attachPaymentMethod(
    userId,
    paymentMethodId,
    setupIntentId
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payment method added successfully",
    data: result,
  });
});

const getAllPaymentMethods = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

  const result = await PaymentService.getAllPaymentMethods(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment methods fetched successfully",
    data: result,
  });
});

const deletePaymentMethod = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

  await PaymentService.deletePaymentMethod(userId, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment method deleted successfully",
    data: null,
  });
});

const setDefaultPaymentMethod = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

    const result = await PaymentService.setDefaultPaymentMethod(userId, id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Default payment method updated successfully",
      data: result,
    });
  }
);

const processMilestonePayment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const { milestoneId } = req.params;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

    const result = await PaymentService.processMilestonePayment(
      userId,
      milestoneId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment processed successfully",
      data: result,
    });
  }
);

const getMilestonePayments = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { milestoneId } = req.params;

    const result = await PaymentService.getMilestonePayments(milestoneId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Milestone payments fetched successfully",
      data: result,
    });
  }
);

const getUserPayments = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

    const result = await PaymentService.getUserPayments(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User payments fetched successfully",
      data: result,
    });
  }
);

const getPaymentInvoice = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

    const result = await PaymentService.getPaymentInvoice(paymentId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Invoice fetched successfully",
      data: result,
    });
  }
);

export const PaymentController = {
  createSetupIntent,
  attachPaymentMethod,
  getAllPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  processMilestonePayment,
  getMilestonePayments,
  getUserPayments,
  getPaymentInvoice,
};

