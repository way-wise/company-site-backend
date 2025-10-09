import { Prisma, Role } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./role.constants";
import {
  IAssignPermissionsToRole,
  IAssignRoleToUser,
  ICreateRole,
  IRoleFilterParams,
  IUpdateRole,
} from "./role.interface";

const getAllRoles = async (
  queryParams: IRoleFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.RoleWhereInput[] = [];

  //@ searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  //@ filtering with exact value
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const result = await prisma.role.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          userRoles: true,
          rolePermissions: true,
        },
      },
    },
  });

  const total = await prisma.role.count({
    where: conditions.length > 0 ? { AND: conditions } : {},
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    result,
  };
};

const getSingleRole = async (id: string) => {
  const role = await prisma.role.findUniqueOrThrow({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return role;
};

const createRole = async (data: ICreateRole): Promise<Role> => {
  // Check if role with same name already exists
  const existingRole = await prisma.role.findUnique({
    where: { name: data.name },
  });

  if (existingRole) {
    throw new Error("Role with this name already exists");
  }

  const { permissionIds, ...roleData } = data;

  const role = await prisma.$transaction(async (txClient) => {
    // Create role
    const newRole = await txClient.role.create({
      data: roleData,
    });

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      await txClient.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: newRole.id,
          permissionId,
        })),
      });
    }

    return newRole;
  });

  return role;
};

const updateRole = async (id: string, data: IUpdateRole): Promise<Role> => {
  // Check if role exists
  await prisma.role.findUniqueOrThrow({
    where: { id },
  });

  // If updating name, check for duplicates
  if (data.name) {
    const existingRole = await prisma.role.findFirst({
      where: {
        name: data.name,
        NOT: { id },
      },
    });

    if (existingRole) {
      throw new Error("Role with this name already exists");
    }
  }

  const role = await prisma.role.update({
    where: { id },
    data,
  });

  return role;
};

const deleteRole = async (id: string) => {
  // Check if role exists
  await prisma.role.findUniqueOrThrow({
    where: { id },
  });

  // Check if role is assigned to any users
  const assignedUsers = await prisma.userRoleAssignment.count({
    where: { roleId: id },
  });

  if (assignedUsers > 0) {
    throw new Error(
      `Cannot delete role. It is currently assigned to ${assignedUsers} user(s)`
    );
  }

  // Delete role (cascade will handle rolePermissions)
  await prisma.role.delete({
    where: { id },
  });

  return { message: "Role deleted successfully" };
};

const assignPermissionsToRole = async (
  roleId: string,
  data: IAssignPermissionsToRole
) => {
  // Check if role exists
  await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
  });

  // Verify all permissions exist
  const permissions = await prisma.permission.findMany({
    where: {
      id: {
        in: data.permissionIds,
      },
    },
  });

  if (permissions.length !== data.permissionIds.length) {
    throw new Error("One or more permission IDs are invalid");
  }

  // Remove existing permissions and add new ones
  await prisma.$transaction(async (txClient) => {
    // Delete existing role permissions
    await txClient.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new role permissions
    await txClient.rolePermission.createMany({
      data: data.permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });
  });

  return { message: "Permissions assigned successfully" };
};

const removePermissionFromRole = async (
  roleId: string,
  permissionId: string
) => {
  // Check if role exists
  await prisma.role.findUniqueOrThrow({
    where: { id: roleId },
  });

  // Check if permission exists
  await prisma.permission.findUniqueOrThrow({
    where: { id: permissionId },
  });

  // Remove permission from role
  await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId,
    },
  });

  return { message: "Permission removed from role successfully" };
};

const assignRoleToUser = async (data: IAssignRoleToUser) => {
  // Check if user exists
  await prisma.user.findUniqueOrThrow({
    where: { id: data.userId },
  });

  // Check if role exists
  await prisma.role.findUniqueOrThrow({
    where: { id: data.roleId },
  });

  // Check if already assigned
  const existingAssignment = await prisma.userRoleAssignment.findUnique({
    where: {
      userId_roleId: {
        userId: data.userId,
        roleId: data.roleId,
      },
    },
  });

  if (existingAssignment) {
    throw new Error("This role is already assigned to the user");
  }

  // Assign role to user
  await prisma.userRoleAssignment.create({
    data,
  });

  return { message: "Role assigned to user successfully" };
};

const removeRoleFromUser = async (data: IAssignRoleToUser) => {
  // Check if assignment exists
  const assignment = await prisma.userRoleAssignment.findUnique({
    where: {
      userId_roleId: {
        userId: data.userId,
        roleId: data.roleId,
      },
    },
  });

  if (!assignment) {
    throw new Error("This role is not assigned to the user");
  }

  // Remove role from user
  await prisma.userRoleAssignment.delete({
    where: {
      userId_roleId: {
        userId: data.userId,
        roleId: data.roleId,
      },
    },
  });

  return { message: "Role removed from user successfully" };
};

const getUserRoles = async (userId: string) => {
  // Check if user exists
  await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const userRoles = await prisma.userRoleAssignment.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return userRoles;
};

const getUserPermissions = async (userId: string) => {
  // Check if user exists
  await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  // Get all roles for the user
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // Extract unique permissions
  const permissionsMap = new Map();
  userRoles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rp) => {
      permissionsMap.set(rp.permission.id, rp.permission);
    });
  });

  return Array.from(permissionsMap.values());
};

export const roleService = {
  getAllRoles,
  getSingleRole,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  removePermissionFromRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getUserPermissions,
};
