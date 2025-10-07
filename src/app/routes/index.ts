import express from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { leaveRoutes } from "../modules/leave/leave.routes";
import { ServiceRoutes } from "../modules/service/service.routes";
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
