import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import * as bcrypt from "bcrypt";
import { DEFAULT_PERMISSIONS } from "../src/app/modules/permission/permission.constants";
import { DEFAULT_ROLES } from "../src/app/modules/role/role.constants";

const prisma = new PrismaClient();

async function main() {
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
			"view_all_blogs",
			"update_blog",
			"update_all_blogs",
			"delete_blog",
			"delete_all_blogs",

			// Comment Management
			"read_comment",
			"delete_comment",

			// Partner Management
			"create_partner",
			"read_partner",
			"update_partner",
			"delete_partner",
			"toggle_partner_visibility",

			// Financial Management
			"create_earning",
			"read_earning",
			"update_earning",
			"delete_earning",
			"create_expense",
			"read_expense",
			"update_expense",
			"delete_expense",

			// FAQ Management
			"create_faq",
			"read_faq",
			"update_faq",
			"delete_faq",
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
			"read_blog",
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

	// Seed Live Projects
	console.log("📋 Creating live projects...");
	
	// Get user profiles for assigned members
	const userProfiles = await prisma.userProfile.findMany({
		take: 3,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (userProfiles.length >= 2) {
		const assignedMemberId = userProfiles[0].id;
		const userId = userProfiles[0].user.id;
		const userName = userProfiles[0].user.name || userProfiles[0].user.email;

		// Live Project 1: Fixed Price Project
		const fixedProjectBudget = new Decimal(50000);
		const fixedPaidAmount = new Decimal(15000);
		const fixedDueAmount = new Decimal(50000 - 15000);
		const fixedDeadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

		await prisma.liveProject.upsert({
			where: {
				id: "live-project-1-seed",
			},
			update: {},
			create: {
				id: "live-project-1-seed",
				projectName: "E-commerce Platform Development",
				clientName: "TechCorp Solutions",
				clientLocation: "San Francisco, CA, USA",
				projectType: "FIXED",
				projectBudget: fixedProjectBudget,
				paidAmount: fixedPaidAmount,
				dueAmount: fixedDueAmount,
				assignedMembers: assignedMemberId,
				projectStatus: "ACTIVE",
				deadline: fixedDeadline,
				progress: 45,
				dailyNotes: [
					{
						note: "Initial project kickoff meeting completed. Client requirements discussed.",
						createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
						userId,
						userName,
						type: "note",
					},
					{
						note: "Design mockups approved by client. Moving to development phase.",
						createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
						userId,
						userName,
						type: "note",
					},
					{
						note: "First milestone completed. Received payment of $15,000.",
						createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
						userId,
						userName,
						type: "note",
					},
					{
						note: "Complete backend API development and prepare for second milestone review",
						createdAt: new Date().toISOString(),
						userId,
						userName,
						type: "action",
					},
				],
				nextActions: "Complete backend API development and prepare for second milestone review",
			},
		});

		// Live Project 2: Hourly Rate Project
		const hourlyDeadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

		await prisma.liveProject.upsert({
			where: {
				id: "live-project-2-seed",
			},
			update: {},
			create: {
				id: "live-project-2-seed",
				projectName: "Website Redesign & Maintenance",
				clientName: "Global Marketing Agency",
				clientLocation: "London, UK",
				projectType: "HOURLY",
				projectBudget: null, // Null for HOURLY projects
				paidAmount: null, // Null for HOURLY projects
				dueAmount: null, // Null for HOURLY projects
				assignedMembers: assignedMemberId, // Single member assigned
				projectStatus: "ON_HOLD",
				deadline: hourlyDeadline,
				progress: 30,
				dailyNotes: [
					{
						note: "Project started. Client requested hourly billing model.",
						createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
						userId,
						userName,
						type: "note",
					},
					{
						note: "Client requested to pause project temporarily due to budget review.",
						createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
						userId,
						userName,
						type: "note",
					},
					{
						note: "Wait for client confirmation to resume work. Estimated 40 hours remaining.",
						createdAt: new Date().toISOString(),
						userId,
						userName,
						type: "action",
					},
				],
				nextActions: "Wait for client confirmation to resume work. Estimated 40 hours remaining.",
			},
		});

		console.log("✅ Created 2 live projects");
	} else {
		console.log("⚠️  Not enough user profiles found. Skipping live project seeding.");
	}

	// Seed New Live Projects
	console.log("📋 Creating new live projects...");
	
	// Get user profiles for assigned members
	const newProjectUserProfiles = await prisma.userProfile.findMany({
		take: 5,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	if (newProjectUserProfiles.length >= 2) {
		const creatorId = newProjectUserProfiles[0].id;
		const memberIds = newProjectUserProfiles.slice(0, 3).map(up => up.user.name || up.user.email);

		// New Live Project 1: FIXED - E-commerce Platform
		const fixedProject1Budget = new Decimal(75000);
		const fixedProject1Paid = new Decimal(25000);
		const fixedProject1Due = new Decimal(50000);
		const fixedProject1Deadline = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000); // 120 days

		const newFixedProject1 = await prisma.newLiveProject.upsert({
			where: {
				id: "new-live-project-1-seed",
			},
			update: {},
			create: {
				id: "new-live-project-1-seed",
				projectName: "E-commerce Platform Development",
				clientName: "RetailMax Inc.",
				clientLocation: "New York, NY, USA",
				assignedMembers: memberIds,
				projectType: "FIXED",
				projectStatus: "ACTIVE",
				projectBudget: fixedProject1Budget,
				paidAmount: fixedProject1Paid,
				dueAmount: fixedProject1Due,
				committedDeadline: fixedProject1Deadline,
				targetedDeadline: {
					backend: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
					frontend: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
					ui: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				},
				documents: [
					{
						fileName: "project-requirements.pdf",
						fileUrl: "https://example.com/documents/requirements.pdf",
						fileType: "application/pdf",
						fileSize: 245760,
						uploadedBy: creatorId,
						uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
					},
				],
				createdBy: creatorId,
			},
		});

		// Add project actions for Project 1
		await prisma.newProjectAction.createMany({
			data: [
				{
					projectId: newFixedProject1.id,
					actionText: "Initial project kickoff meeting scheduled",
					actionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
					createdBy: creatorId,
				},
				{
					projectId: newFixedProject1.id,
					actionText: "Complete backend API development for user authentication",
					actionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
					createdBy: creatorId,
				},
				{
					projectId: newFixedProject1.id,
					actionText: "Review and implement payment gateway integration",
					actionDate: new Date(),
					createdBy: creatorId,
				},
			],
			skipDuplicates: true,
		});

		// New Live Project 2: FIXED - Mobile App Development
		const fixedProject2Budget = new Decimal(120000);
		const fixedProject2Paid = new Decimal(40000);
		const fixedProject2Due = new Decimal(80000);
		const fixedProject2Deadline = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days

		const newFixedProject2 = await prisma.newLiveProject.upsert({
			where: {
				id: "new-live-project-2-seed",
			},
			update: {},
			create: {
				id: "new-live-project-2-seed",
				projectName: "Mobile Banking App",
				clientName: "FinanceHub Bank",
				clientLocation: "Toronto, Canada",
				assignedMembers: memberIds.slice(0, 2),
				projectType: "FIXED",
				projectStatus: "PENDING",
				projectBudget: fixedProject2Budget,
				paidAmount: fixedProject2Paid,
				dueAmount: fixedProject2Due,
				committedDeadline: fixedProject2Deadline,
				targetedDeadline: {
					backend: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
					frontend: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
					ui: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
				},
				createdBy: creatorId,
			},
		});

		// New Live Project 3: HOURLY - Website Maintenance
		const hourlyProject1Limit = new Decimal(40); // 40 hours per week
		const hourlyProject1Deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

		const newHourlyProject1 = await prisma.newLiveProject.upsert({
			where: {
				id: "new-live-project-3-seed",
			},
			update: {},
			create: {
				id: "new-live-project-3-seed",
				projectName: "Website Maintenance & Support",
				clientName: "TechStart Solutions",
				clientLocation: "Austin, TX, USA",
				assignedMembers: [memberIds[0]],
				projectType: "HOURLY",
				projectStatus: "ACTIVE",
				weeklyLimit: hourlyProject1Limit,
				committedDeadline: hourlyProject1Deadline,
				createdBy: creatorId,
			},
		});

		// Add hour logs for HOURLY Project 1
		const hourlyProject1UserId = newProjectUserProfiles[0].id;
		await prisma.newHourLog.createMany({
			data: [
				{
					projectId: newHourlyProject1.id,
					userId: hourlyProject1UserId,
					date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
					submittedHours: new Decimal(8),
				},
				{
					projectId: newHourlyProject1.id,
					userId: hourlyProject1UserId,
					date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
					submittedHours: new Decimal(7.5),
				},
				{
					projectId: newHourlyProject1.id,
					userId: hourlyProject1UserId,
					date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
					submittedHours: new Decimal(6),
				},
				{
					projectId: newHourlyProject1.id,
					userId: hourlyProject1UserId,
					date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
					submittedHours: new Decimal(8),
				},
				{
					projectId: newHourlyProject1.id,
					userId: hourlyProject1UserId,
					date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
					submittedHours: new Decimal(7),
				},
			],
			skipDuplicates: true,
		});

		// Add project actions for HOURLY Project 1
		await prisma.newProjectAction.createMany({
			data: [
				{
					projectId: newHourlyProject1.id,
					actionText: "Fixed critical bug in payment processing",
					actionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
					createdBy: creatorId,
				},
				{
					projectId: newHourlyProject1.id,
					actionText: "Update security patches and perform routine maintenance",
					actionDate: new Date(),
					createdBy: creatorId,
				},
			],
			skipDuplicates: true,
		});

		// New Live Project 4: HOURLY - API Development
		const hourlyProject2Limit = new Decimal(30); // 30 hours per week
		const hourlyProject2Deadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

		const newHourlyProject2 = await prisma.newLiveProject.upsert({
			where: {
				id: "new-live-project-4-seed",
			},
			update: {},
			create: {
				id: "new-live-project-4-seed",
				projectName: "RESTful API Development",
				clientName: "DataSync Corp",
				clientLocation: "Seattle, WA, USA",
				assignedMembers: memberIds.slice(0, 2),
				projectType: "HOURLY",
				projectStatus: "ACTIVE",
				weeklyLimit: hourlyProject2Limit,
				committedDeadline: hourlyProject2Deadline,
				targetedDeadline: {
					backend: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
				},
				createdBy: creatorId,
			},
		});

		// Add hour logs for HOURLY Project 2
		const hourlyProject2UserId = newProjectUserProfiles[1].id;
		await prisma.newHourLog.createMany({
			data: [
				{
					projectId: newHourlyProject2.id,
					userId: hourlyProject2UserId,
					date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
					submittedHours: new Decimal(6),
				},
				{
					projectId: newHourlyProject2.id,
					userId: hourlyProject2UserId,
					date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
					submittedHours: new Decimal(5.5),
				},
				{
					projectId: newHourlyProject2.id,
					userId: hourlyProject2UserId,
					date: new Date(), // Today
					submittedHours: new Decimal(7),
				},
			],
			skipDuplicates: true,
		});

		// New Live Project 5: FIXED - Completed Project
		const fixedProject3Budget = new Decimal(45000);
		const fixedProject3Paid = new Decimal(45000);
		const fixedProject3Due = new Decimal(0);
		const fixedProject3Deadline = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

		const newFixedProject3 = await prisma.newLiveProject.upsert({
			where: {
				id: "new-live-project-5-seed",
			},
			update: {},
			create: {
				id: "new-live-project-5-seed",
				projectName: "Corporate Website Redesign",
				clientName: "BusinessFirst LLC",
				clientLocation: "Chicago, IL, USA",
				assignedMembers: memberIds,
				projectType: "FIXED",
				projectStatus: "COMPLETED",
				projectBudget: fixedProject3Budget,
				paidAmount: fixedProject3Paid,
				dueAmount: fixedProject3Due,
				committedDeadline: fixedProject3Deadline,
				documents: [
					{
						fileName: "final-deliverables.zip",
						fileUrl: "https://example.com/documents/deliverables.zip",
						fileType: "application/zip",
						fileSize: 15728640,
						uploadedBy: creatorId,
						uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
					},
					{
						fileName: "project-summary.pdf",
						fileUrl: "https://example.com/documents/summary.pdf",
						fileType: "application/pdf",
						fileSize: 512000,
						uploadedBy: creatorId,
						uploadedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
					},
				],
				createdBy: creatorId,
			},
		});

		// Add project actions for Completed Project
		await prisma.newProjectAction.createMany({
			data: [
				{
					projectId: newFixedProject3.id,
					actionText: "Project completed and delivered to client",
					actionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					createdBy: creatorId,
				},
				{
					projectId: newFixedProject3.id,
					actionText: "Final payment received. Project closed.",
					actionDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
					createdBy: creatorId,
				},
			],
			skipDuplicates: true,
		});

		console.log("✅ Created 5 new live projects (3 FIXED, 2 HOURLY)");
		console.log("✅ Created project actions and hour logs");
	} else {
		console.log("⚠️  Not enough user profiles found. Skipping new live project seeding.");
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
