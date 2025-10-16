import express from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { leaveRoutes } from "../modules/leave/leave.routes";
import { MilestoneRoutes } from "../modules/milestone/milestone.routes";
import { permissionRoutes } from "../modules/permission/permission.routes";
import { ProjectRoutes } from "../modules/project/project.routes";
import { roleRoutes } from "../modules/role/role.routes";
import { ServiceRoutes } from "../modules/service/service.routes";
import { TaskRoutes } from "../modules/task/task.routes";
import { userRoutes } from "../modules/user/user.routes";

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
    path: "/service",
    route: ServiceRoutes,
  },
  {
    path: "/leaves",
    route: leaveRoutes,
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
    path: "/milestones",
    route: MilestoneRoutes,
  },
  {
    path: "/tasks",
    route: TaskRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
