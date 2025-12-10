import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
// User controller uses filterValidQueryParams instead of pick.
import { Faq } from "@prisma/client";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { FaqService } from "./faq.service";

const createFaq = catchAsync(async (req: Request, res: Response) => {
	const result = await FaqService.createFaq(req.body);
	sendResponse<Faq>(res, {
		statusCode: httpStatus.CREATED, // Changed to CREATED
		success: true,
		message: "Faq created successfully",
		data: result,
	});
});

const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
	const filters = filterValidQueryParams(req.query, [
		"searchTerm",
		"category",
		"isShow",
	]);

	if (filters.isShow) {
		(filters as any).isShow = filters.isShow === "true";
	}
	const options = filterValidQueryParams(req.query, paginationAndSortingParams);

	const result = await FaqService.getAllFaqs(filters, options);
	sendResponse<Faq[]>(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Faqs fetched successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getSingleFaq = catchAsync(async (req: Request, res: Response) => {
	const result = await FaqService.getSingleFaq(req.params.id);
	sendResponse<Faq>(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Faq fetched successfully",
		data: result,
	});
});

const updateFaq = catchAsync(async (req: Request, res: Response) => {
	const result = await FaqService.updateFaq(req.params.id, req.body);
	sendResponse<Faq>(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Faq updated successfully",
		data: result,
	});
});

const deleteFaq = catchAsync(async (req: Request, res: Response) => {
	const result = await FaqService.deleteFaq(req.params.id);
	sendResponse<Faq>(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Faq deleted successfully",
		data: result,
	});
});

export const FaqController = {
	createFaq,
	getAllFaqs,
	getSingleFaq,
	updateFaq,
	deleteFaq,
};
