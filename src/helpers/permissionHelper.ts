import prisma from "../shared/prismaClient";
import { cacheKeys, invalidateUserCache, permissionCache } from "./cacheHelper";

/**
 * Optimized single query to fetch user permissions from database
 * This consolidates all permission fetching logic to avoid N+1 queries
 * @param userId - The user's ID
 * @returns Array of permission names
 */
const fetchUserPermissionsFromDB = async (
  userId: string
): Promise<string[]> => {
  // Single optimized query with proper joins
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
 * Get all permissions for a user (with caching)
 * @param userId - The user's ID
 * @returns Array of permission names
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  const cacheKey = cacheKeys.userPermissions(userId);

  // Try cache first
  const cached = permissionCache.get<string[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from database
  const permissions = await fetchUserPermissionsFromDB(userId);

  // Cache for future requests
  permissionCache.set(cacheKey, permissions);

  return permissions;
};

/**
 * Check if a user has a specific permission (optimized with cache)
 * @param userId - The user's ID
 * @param permissionName - The permission name to check
 * @returns boolean
 */
export const hasPermission = async (
  userId: string,
  permissionName: string
): Promise<boolean> => {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionName);
};

/**
 * Check if a user has any of the specified permissions (optimized with batch check)
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names to check
 * @returns boolean
 */
export const hasAnyPermission = async (
  userId: string,
  permissionNames: string[]
): Promise<boolean> => {
  if (permissionNames.length === 0) {
    return true;
  }

  // Get user permissions (cached)
  const userPermissions = await getUserPermissions(userId);

  // Check if any of the required permissions exist in user's permissions
  // Using Set for O(1) lookup instead of O(n) array.includes
  const userPermissionsSet = new Set(userPermissions);
  return permissionNames.some((permName) => userPermissionsSet.has(permName));
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
  if (permissionNames.length === 0) {
    return true;
  }

  // Get user permissions (cached)
  const userPermissions = await getUserPermissions(userId);

  // Check if user has all required permissions
  // Using Set for O(1) lookup instead of O(n) array.includes
  const userPermissionsSet = new Set(userPermissions);
  return permissionNames.every((permName) => userPermissionsSet.has(permName));
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
  // Export cache invalidation for use in controllers
  invalidateUserCache,
};
