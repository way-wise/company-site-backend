import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { ContactService } from "./contact.service";

const createContact = catchAsync(async (req: Request, res: Response) => {
	const result = await ContactService.createContact(req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contact form submitted successfully!",
		data: result,
	});
});

export const ContactController = {
	createContact,
};
