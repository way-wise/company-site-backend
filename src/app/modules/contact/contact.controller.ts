import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { ContactService } from "./contact.service";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { paginationAndSortingParams } from "../../../shared/appConstants";

const createContact = catchAsync(async (req: Request, res: Response) => {
	const result = await ContactService.createContact(req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contact form submitted successfully!",
		data: result,
	});
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
	const filters = filterValidQueryParams(req.query, ["searchTerm"]);
	const options = filterValidQueryParams(req.query, paginationAndSortingParams);

	const result = await ContactService.getAllContacts(filters, options);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contacts fetched successfully",
		meta: result.meta,
		data: result.data,
	});
});

export const ContactController = {
	createContact,
	getAllContacts,
};
