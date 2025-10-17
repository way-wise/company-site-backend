import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./service.constants";
import { ServiceService } from "./service.service";

const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.createServiceIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Service created successfully!",
    data: result,
  });
});

const getAllService = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await ServiceService.getAllServiceFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service data fetched!",
    data: result,
  });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceService.getSingleServiceFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service data fetched successfully!",
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceService.updateServiceIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service data updated successfully!",
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceService.deleteServiceFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Service data deleted successfully!",
    data: result,
  });
});

export const ServiceController = {
  createService,
  getAllService,
  getSingleService,
  updateService,
  deleteService,
};
