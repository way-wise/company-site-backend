import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ExpenseController } from "./expense.controller";
import { expenseValidationSchemas } from "./expense.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/expenses:
 *   post:
 *     tags: [Expenses]
 *     summary: Create expense
 *     description: Create a new expense record. Requires 'create_expense' permission.
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
 *               - amount
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *               receiptUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Expenses]
 *     summary: Get all expenses
 *     description: Get all expenses with filtering and pagination. Requires 'read_expense' permission.
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
 *         description: Expenses fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/expenses/stats:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expense statistics
 *     description: Get expense statistics. Requires 'read_expense' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/expenses/{id}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get single expense
 *     description: Get a single expense by ID. Requires 'read_expense' permission.
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
 *         description: Expense fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 *   patch:
 *     tags: [Expenses]
 *     summary: Update expense
 *     description: Update an expense. Requires 'update_expense' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete expense
 *     description: Delete an expense. Requires 'delete_expense' permission.
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
 *         description: Expense deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 */
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

