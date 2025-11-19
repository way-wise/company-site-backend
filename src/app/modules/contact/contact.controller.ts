import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { ContactService } from "./contact.service";

const submitContactForm = catchAsync(
  async (req: Request, res: Response) => {
    await ContactService.submitContactForm(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Thank you for your inquiry! We'll get back to you within 24 hours.",
      data: null,
    });
  }
);

export const ContactController = {
  submitContactForm,
};

