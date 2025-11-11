import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { DEFAULT_PERMISSIONS } from "../src/app/modules/permission/permission.constants";
import { DEFAULT_ROLES } from "../src/app/modules/role/role.constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Permissions
  console.log(" Creating permissions...");
  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log(`✅ Created ${DEFAULT_PERMISSIONS.length} permissions`);

  // Seed Roles
  console.log("Creating roles...");
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log(`✅ Created ${DEFAULT_ROLES.length} roles`);

  // Assign all permissions to SUPER_ADMIN
  console.log("🔐 Assigning permissions to roles...");
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
  });

  if (superAdminRole) {
    const allPermissions = await prisma.permission.findMany();

    // Delete existing permissions for SUPER_ADMIN
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id },
    });

    // Assign all permissions
    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${allPermissions.length} permissions to SUPER_ADMIN`
    );
  }

  // Assign permissions to ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  if (adminRole) {
    const adminPermissionNames = [
      // User Management
      "read_user",
      "update_user",
      "ban_user",

      // Project Management
      "create_project",
      "read_project",
      "view_all_projects",
      "update_project",
      "delete_project",
      "manage_milestones",

      // Milestone Management
      "create_milestone",
      "read_milestone",
      "update_milestone",
      "delete_milestone",

      // Service Management
      "read_service",

      // Leave Management
      "read_leave",
      "approve_leave",
      "manage_leave_types",
      "view_team_leaves",
      "manage_leave_balance",

      // Blog Management
      "create_blog",
      "read_blog",
      "update_blog",
      "delete_blog",

      // Comment Management
      "read_comment",
      "delete_comment",
    ];

    const adminPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: adminPermissionNames,
        },
      },
    });

    // Delete existing permissions for ADMIN
    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id },
    });

    for (const permission of adminPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`✅ Assigned ${adminPermissions.length} permissions to ADMIN`);
  }

  // Assign permissions to CLIENT role
  const clientRole = await prisma.role.findUnique({
    where: { name: "CLIENT" },
  });

  if (clientRole) {
    const clientPermissionNames = [
      "read_user",
      "create_user",
      "read_service",
      "create_service",
      "read_project",
      "create_comment",
      "read_comment",
      "update_comment",
      "delete_comment",
      "read_blog",
    ];

    const clientPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: clientPermissionNames,
        },
      },
    });

    // Delete existing permissions for CLIENT
    await prisma.rolePermission.deleteMany({
      where: { roleId: clientRole.id },
    });

    for (const permission of clientPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: clientRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${clientPermissions.length} permissions to CLIENT`
    );
  }

  // Assign permissions to EMPLOYEE role
  const employeeRole = await prisma.role.findUnique({
    where: { name: "EMPLOYEE" },
  });

  if (employeeRole) {
    const employeePermissionNames = [
      "read_project",
      "manage_milestones",
      "read_milestone",
      "create_leave",
      "read_leave",
      "update_leave",
      "read_service",
    ];

    const employeePermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: employeePermissionNames,
        },
      },
    });

    // Delete existing permissions for EMPLOYEE
    await prisma.rolePermission.deleteMany({
      where: { roleId: employeeRole.id },
    });

    for (const permission of employeePermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(
      `✅ Assigned ${employeePermissions.length} permissions to EMPLOYEE`
    );
  }

  // Create default SUPER_ADMIN user
  console.log("👤 Creating default admin user...");
  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create user
    const adminUser = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        status: "ACTIVE",
        isPasswordChangeRequired: false,
      },
    });

    // Create user profile
    await prisma.userProfile.create({
      data: {
        userId: adminUser.id,
        gender: "MALE",
      },
    });

    // Assign SUPER_ADMIN role
    if (superAdminRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      });
    }

    console.log("✅ Default admin user created successfully");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
  } else {
    console.log("ℹ️  Default admin user already exists");
  }

  console.log("✨ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
