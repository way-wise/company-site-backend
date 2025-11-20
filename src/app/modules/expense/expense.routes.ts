import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ExpenseController } from "./expense.controller";
import { expenseValidationSchemas } from "./expense.validationSchema";

const router = express.Router();

router.post(
  "/",
  permissionGuard("create_expense"),
  validateRequest(expenseValidationSchemas.create),
  ExpenseController.createExpense
);

router.get(
  "/",
  permissionGuard("read_expense"),
  ExpenseController.getAllExpenses
);

router.get(
  "/stats",
  permissionGuard("read_expense"),
  ExpenseController.getExpenseStats
);

router.get(
  "/:id",
  permissionGuard("read_expense"),
  ExpenseController.getSingleExpense
);

router.patch(
  "/:id",
  permissionGuard("update_expense"),
  validateRequest(expenseValidationSchemas.update),
  ExpenseController.updateExpense
);

router.delete(
  "/:id",
  permissionGuard("delete_expense"),
  ExpenseController.deleteExpense
);

export const ExpenseRoutes = router;

