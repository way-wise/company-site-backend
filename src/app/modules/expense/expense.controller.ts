import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./expense.constants";
import { ExpenseService } from "./expense.service";

const createExpense = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userProfileId = req.user?.userProfile?.id;
  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
      data: null,
    });
  }

  const result = await ExpenseService.createExpenseIntoDB({
    ...req.body,
    createdBy: userProfileId,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Expense created successfully!",
    data: result,
  });
});

const getAllExpenses = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await ExpenseService.getAllExpensesFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expenses fetched successfully!",
    meta: result.meta,
    data: result,
  });
});

const getSingleExpense = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ExpenseService.getSingleExpenseFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expense fetched successfully!",
    data: result,
  });
});

const updateExpense = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ExpenseService.updateExpenseIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expense updated successfully!",
    data: result,
  });
});

const deleteExpense = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ExpenseService.deleteExpenseFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expense deleted successfully!",
    data: result,
  });
});

const getExpenseStats = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const result = await ExpenseService.getExpenseStatsFromDB(
    startDate as string | undefined,
    endDate as string | undefined
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expense statistics fetched successfully!",
    data: result,
  });
});

export const ExpenseController = {
  createExpense,
  getAllExpenses,
  getSingleExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
};

