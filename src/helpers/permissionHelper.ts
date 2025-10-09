import prisma from "../shared/prismaClient";

/**
 * Check if a user has a specific permission
 * @param userId - The user's ID
 * @param permissionName - The permission name to check
 * @returns boolean
 */
export const hasPermission = async (
  userId: string,
  permissionName: string
): Promise<boolean> => {
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

  // Check if any of the user's roles has the required permission
  for (const userRole of userRoles) {
    const hasRequiredPermission = userRole.role.rolePermissions.some(
      (rp) => rp.permission.name === permissionName
    );
    if (hasRequiredPermission) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a user has any of the specified permissions
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names to check
 * @returns boolean
 */
export const hasAnyPermission = async (
  userId: string,
  permissionNames: string[]
): Promise<boolean> => {
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

  // Check if any of the user's roles has any of the required permissions
  for (const userRole of userRoles) {
    const hasRequiredPermission = userRole.role.rolePermissions.some((rp) =>
      permissionNames.includes(rp.permission.name)
    );
    if (hasRequiredPermission) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a user has all of the specified permissions
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names to check
 * @returns boolean
 */
export const hasAllPermissions = async (
  userId: string,
  permissionNames: string[]
): Promise<boolean> => {
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

  // Collect all unique permissions the user has
  const userPermissions = new Set<string>();
  userRoles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rp) => {
      userPermissions.add(rp.permission.name);
    });
  });

  // Check if user has all required permissions
  return permissionNames.every((permName) => userPermissions.has(permName));
};

/**
 * Get all permissions for a user
 * @param userId - The user's ID
 * @returns Array of permission names
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
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

  // Collect all unique permissions
  const permissionsSet = new Set<string>();
  userRoles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rp) => {
      permissionsSet.add(rp.permission.name);
    });
  });

  return Array.from(permissionsSet);
};

/**
 * Check if a user has a specific role
 * @param userId - The user's ID
 * @param roleName - The role name to check
 * @returns boolean
 */
export const hasRole = async (
  userId: string,
  roleName: string
): Promise<boolean> => {
  const userRole = await prisma.userRoleAssignment.findFirst({
    where: {
      userId,
      role: {
        name: roleName,
      },
    },
  });

  return !!userRole;
};

/**
 * Check if a user has any of the specified roles
 * @param userId - The user's ID
 * @param roleNames - Array of role names to check
 * @returns boolean
 */
export const hasAnyRole = async (
  userId: string,
  roleNames: string[]
): Promise<boolean> => {
  const userRole = await prisma.userRoleAssignment.findFirst({
    where: {
      userId,
      role: {
        name: {
          in: roleNames,
        },
      },
    },
  });

  return !!userRole;
};

export const permissionHelper = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  hasRole,
  hasAnyRole,
};
