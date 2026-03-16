import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { SeoSetting } from "@prisma/client";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { SeoService } from "./seo.service";

const createSeo = catchAsync(async (req: Request, res: Response) => {
  const result = await SeoService.createSeo(req.body);
  sendResponse<SeoSetting>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "SEO setting created successfully",
    data: result,
  });
});

const getAllSeoSettings = catchAsync(async (req: Request, res: Response) => {
  const filters = filterValidQueryParams(req.query, [
    "searchTerm",
    "pageSlug",
    "isActive",
  ]);

  if (filters.isActive !== undefined) {
    (filters as Record<string, unknown>).isActive = filters.isActive === "true";
  }

  const options = filterValidQueryParams(req.query, paginationAndSortingParams);

  const result = await SeoService.getAllSeoSettings(filters, options);
  sendResponse<SeoSetting[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SEO settings fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleSeo = catchAsync(async (req: Request, res: Response) => {
  const result = await SeoService.getSingleSeo(req.params.id);
  sendResponse<SeoSetting>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SEO setting fetched successfully",
    data: result,
  });
});

const getSeoBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await SeoService.getSeoBySlug(req.params.slug);
  sendResponse<SeoSetting>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SEO setting fetched successfully",
    data: result,
  });
});

const updateSeo = catchAsync(async (req: Request, res: Response) => {
  const result = await SeoService.updateSeo(req.params.id, req.body);
  sendResponse<SeoSetting>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SEO setting updated successfully",
    data: result,
  });
});

const deleteSeo = catchAsync(async (req: Request, res: Response) => {
  const result = await SeoService.deleteSeo(req.params.id);
  sendResponse<SeoSetting>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SEO setting deleted successfully",
    data: result,
  });
});

const upsertSeo = catchAsync(async (req: Request, res: Response) => {
  const result = await SeoService.upsertSeo(req.body.pageSlug, req.body);
  sendResponse<SeoSetting>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SEO setting saved successfully",
    data: result,
  });
});

export const SeoController = {
  createSeo,
  getAllSeoSettings,
  getSingleSeo,
  getSeoBySlug,
  updateSeo,
  deleteSeo,
  upsertSeo,
};
