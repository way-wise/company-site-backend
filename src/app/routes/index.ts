import express from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { BlogRoutes } from "../modules/blog/blog.routes";
import { ChatRoutes } from "../modules/chat/chat.routes";
import { ContactRoutes } from "../modules/contact/contact.routes";
import { leaveRoutes } from "../modules/leave/leave.routes";
import { leaveBalanceRoutes } from "../modules/leaveBalance/leaveBalance.routes";
import { MilestoneRoutes } from "../modules/milestone/milestone.routes";
import { PartnerRoutes } from "../modules/partner/partner.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { permissionRoutes } from "../modules/permission/permission.routes";
import { EarningRoutes } from "../modules/earning/earning.routes";
import { ExpenseRoutes } from "../modules/expense/expense.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { ProjectRoutes } from "../modules/project/project.routes";
import { ProjectNoteRoutes } from "../modules/projectNote/projectNote.routes";
import { ProjectFileRoutes } from "../modules/projectFile/projectFile.routes";
import { roleRoutes } from "../modules/role/role.routes";
import { ServiceRoutes } from "../modules/service/service.routes";
import { TaskRoutes } from "../modules/task/task.routes";
import { userRoutes } from "../modules/user/user.routes";
import { FaqRoutes } from "../modules/faq/faq.routes";
import { LiveProjectRoutes } from "../modules/liveProject/liveProject.routes";

const router = express.Router();

const moduleRoutes = [
	{
		path: "/user",
		route: userRoutes,
	},
	{
		path: "/admin",
		route: AdminRoutes,
	},
	{
		path: "/auth",
		route: authRoutes,
	},
	{
		path: "/blogs",
		route: BlogRoutes,
	},
	{
		path: "/chat",
		route: ChatRoutes,
	},
	{
		path: "/service",
		route: ServiceRoutes,
	},
	{
		path: "/leaves",
		route: leaveRoutes,
	},
	{
		path: "/leave-balance",
		route: leaveBalanceRoutes,
	},
	{
		path: "/permissions",
		route: permissionRoutes,
	},
	{
		path: "/roles",
		route: roleRoutes,
	},
	{
		path: "/projects",
		route: ProjectRoutes,
	},
	{
		path: "/project-notes",
		route: ProjectNoteRoutes,
	},
	{
		path: "/project-files",
		route: ProjectFileRoutes,
	},
	{
		path: "/milestones",
		route: MilestoneRoutes,
	},
	{
		path: "/tasks",
		route: TaskRoutes,
	},
	{
		path: "/payment",
		route: PaymentRoutes,
	},
	{
		path: "/partner",
		route: PartnerRoutes,
	},
	{
		path: "/earnings",
		route: EarningRoutes,
	},
	{
		path: "/expenses",
		route: ExpenseRoutes,
	},
	{
		path: "/notifications",
		route: NotificationRoutes,
	},
	{
		path: "/contact",
		route: ContactRoutes,
	},
	{
		path: "/faqs",
		route: FaqRoutes,
	},
	{
		path: "/live-projects",
		route: LiveProjectRoutes,
	},
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
