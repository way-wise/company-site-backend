# Role-Based Access Control (RBAC) Setup Guide

This guide explains how to set up and use the new role + permission-based authentication system.

## Overview

The system has been upgraded from simple role-based authentication to a comprehensive RBAC (Role-Based Access Control) system with the following features:

- **Permissions**: Granular access control units (e.g., `create_user`, `read_project`)
- **Roles**: Collections of permissions (e.g., `ADMIN`, `CLIENT`, `EMPLOYEE`)
- **User Role Assignments**: Users can have multiple roles
- **Dynamic Permission Checking**: Runtime permission verification

## Database Schema

The new schema includes:

- `Permission` - Individual permissions
- `Role` - User roles
- `RolePermission` - Role-permission mappings (many-to-many)
- `UserRoleAssignment` - User-role assignments (many-to-many)

## Setup Instructions

### 1. Run Database Migration

First, you need to update your Prisma schema and run migrations:

```bash
cd way-wise-backend
npx prisma migrate dev --name add_rbac_system
```

### 2. Seed Default Permissions and Roles

Run the seed script to populate default permissions and roles:

```bash
yarn seed
```

This will create:

- **40+ default permissions** across 8 groups:

  - User Management
  - Role Management
  - Permission Management
  - Project Management
  - Service Management
  - Leave Management
  - Blog Management
  - Comment Management

- **4 default roles**:
  - `SUPER_ADMIN` - Full access to all permissions
  - `ADMIN` - Management access (most permissions except user/role/permission creation)
  - `CLIENT` - Limited access (project viewing, comments)
  - `EMPLOYEE` - Task management access (projects, milestones, leaves)

### 3. Update Environment Variables

Ensure your `.env` file has the correct database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/waywise_db"
```

## Backend Usage

### Using Permission Guards in Routes

There are three types of guards available:

#### 1. Basic Auth Guard (Just Authentication)

```typescript
import authGuard from "../middlewares/authGuard";

router.get("/profile", authGuard(), userController.getProfile);
```

#### 2. Role Guard (Check Roles)

```typescript
import roleGuard from "../middlewares/roleGuard";

// User must have ADMIN OR SUPER_ADMIN role
router.post(
  "/create-user",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  userController.createUser
);
```

#### 3. Permission Guard (Check Permissions)

```typescript
import permissionGuard from "../middlewares/permissionGuard";

// User must have create_user permission
router.post(
  "/users",
  permissionGuard("create_user"),
  userController.createUser
);

// User must have read_user OR update_user permission
router.put(
  "/users/:id",
  permissionGuard("read_user", "update_user"),
  userController.updateUser
);
```

### Using Permission Helpers

```typescript
import { permissionHelper } from "../helpers/permissionHelper";

// Check if user has a specific permission
const canCreateUser = await permissionHelper.hasPermission(
  userId,
  "create_user"
);

// Check if user has any of the permissions
const canManageUsers = await permissionHelper.hasAnyPermission(userId, [
  "create_user",
  "update_user",
  "delete_user",
]);

// Check if user has all permissions
const hasFullAccess = await permissionHelper.hasAllPermissions(userId, [
  "create_user",
  "read_user",
  "update_user",
]);

// Get all user permissions
const permissions = await permissionHelper.getUserPermissions(userId);

// Check if user has a role
const isAdmin = await permissionHelper.hasRole(userId, "ADMIN");
```

## Frontend Usage

### Using Permission Guards in Pages

```typescript
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function UsersPage() {
  return (
    <PermissionGuard
      permissions={["read_user", "create_user"]}
      requireAll={false}
    >
      {/* Page content */}
    </PermissionGuard>
  );
}
```

### Using Role Guards

```typescript
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminPage() {
  return (
    <RoleGuard roles={["ADMIN", "SUPER_ADMIN"]}>
      {/* Admin content */}
    </RoleGuard>
  );
}
```

### Using Permission Checks in Components

```typescript
import { useAuth } from "@/context/UserContext";

function MyComponent() {
  const { hasPermission, hasRole } = useAuth();

  return (
    <div>
      {hasPermission("create_user") && <Button>Create User</Button>}

      {hasRole("ADMIN") && <AdminPanel />}
    </div>
  );
}
```

## API Endpoints

### Permission Management

- `GET /api/permissions` - List all permissions
- `GET /api/permissions/:id` - Get single permission
- `GET /api/permissions/groups` - Get permission groups
- `POST /api/permissions` - Create permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission

### Role Management

- `GET /api/roles` - List all roles
- `GET /api/roles/:id` - Get single role
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Role-Permission Assignment

- `POST /api/roles/:id/permissions` - Assign permissions to role
- `DELETE /api/roles/:roleId/permissions/:permissionId` - Remove permission from role

### User-Role Assignment

- `POST /api/roles/assign-user` - Assign role to user
- `POST /api/roles/remove-user` - Remove role from user
- `GET /api/roles/user/:userId/roles` - Get user roles
- `GET /api/roles/user/:userId/permissions` - Get user permissions

## Migration from Old System

### Old Code (Role-based)

```typescript
// Old user creation
const userData = {
  name: "John Doe",
  email: "john@example.com",
  password: hashedPassword,
  role: UserRole.ADMIN, // ❌ Old way
};
```

### New Code (RBAC)

```typescript
// New user creation
const userData = {
  name: "John Doe",
  email: "john@example.com",
  password: hashedPassword,
  // No role field
};

const newUser = await prisma.user.create({ data: userData });

// Assign role separately
await assignDefaultRole(newUser.id, "ADMIN"); // ✅ New way
```

## Testing

### Create a Test User with Roles

```typescript
// Create user
const user = await prisma.user.create({
  data: {
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
  },
});

// Assign role
const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
await prisma.userRoleAssignment.create({
  data: {
    userId: user.id,
    roleId: adminRole.id,
  },
});
```

## Best Practices

1. **Use Permission Guards for Fine-Grained Control**: Prefer permission-based guards over role-based when possible
2. **Group Related Permissions**: Keep permissions organized by functional groups
3. **Principle of Least Privilege**: Assign only necessary permissions to roles
4. **Regular Audits**: Periodically review role-permission assignments
5. **Document Custom Permissions**: If you add new permissions, document them

## Troubleshooting

### "Role not found" Error

- Make sure you've run the seed script: `yarn seed`

### Permissions Not Working

- Check if the role has the required permissions assigned
- Verify user has the correct role assigned
- Clear frontend auth cache and re-login

### Migration Issues

- Backup your database before migration
- Run: `npx prisma migrate reset` (WARNING: This will delete all data)
- Then run: `yarn seed`

## Adding New Permissions

1. Add to `permission.constants.ts`:

```typescript
export const DEFAULT_PERMISSIONS = [
  // ... existing permissions
  {
    name: "manage_reports",
    group: "report_management",
    description: "Manage system reports",
  },
];
```

2. Run seed script:

```bash
yarn seed
```

3. Assign to appropriate roles in `seed.ts`

## Support

For issues or questions, please contact the development team.
