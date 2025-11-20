export const searchableFields = ["name", "group", "description"];

export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: "user_management",
  ROLE_MANAGEMENT: "role_management",
  PERMISSION_MANAGEMENT: "permission_management",
  PROJECT_MANAGEMENT: "project_management",
  SERVICE_MANAGEMENT: "service_management",
  LEAVE_MANAGEMENT: "leave_management",
  BLOG_MANAGEMENT: "blog_management",
  COMMENT_MANAGEMENT: "comment_management",
  MILESRONE_MANAGEMENT: "milestone_management",
  TASK_MANAGEMENT: "task_management",
  PARTNER_MANAGEMENT: "partner_management",
} as const;

export const DEFAULT_PERMISSIONS = [
  // User Management
  {
    name: "create_user",
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Create new users",
  },
  {
    name: "read_user",
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "View user details",
  },
  {
    name: "update_user",
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Update user information",
  },
  {
    name: "delete_user",
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Delete users",
  },
  {
    name: "ban_user",
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Ban/unban users",
  },

  // Role Management
  {
    name: "create_role",
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Create new roles",
  },
  {
    name: "read_role",
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "View role details",
  },
  {
    name: "update_role",
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Update role information",
  },
  {
    name: "delete_role",
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Delete roles",
  },
  {
    name: "assign_role",
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Assign roles to users",
  },

  // Permission Management
  {
    name: "create_permission",
    group: PERMISSION_GROUPS.PERMISSION_MANAGEMENT,
    description: "Create new permissions",
  },
  {
    name: "read_permission",
    group: PERMISSION_GROUPS.PERMISSION_MANAGEMENT,
    description: "View permission details",
  },
  {
    name: "update_permission",
    group: PERMISSION_GROUPS.PERMISSION_MANAGEMENT,
    description: "Update permission information",
  },
  {
    name: "delete_permission",
    group: PERMISSION_GROUPS.PERMISSION_MANAGEMENT,
    description: "Delete permissions",
  },

  // Project Management
  {
    name: "create_project",
    group: PERMISSION_GROUPS.PROJECT_MANAGEMENT,
    description: "Create new projects",
  },
  {
    name: "read_project",
    group: PERMISSION_GROUPS.PROJECT_MANAGEMENT,
    description: "View project details",
  },
  {
    name: "view_all_projects",
    group: PERMISSION_GROUPS.PROJECT_MANAGEMENT,
    description: "View all projects in the system",
  },
  {
    name: "update_project",
    group: PERMISSION_GROUPS.PROJECT_MANAGEMENT,
    description: "Update project information",
  },
  {
    name: "delete_project",
    group: PERMISSION_GROUPS.PROJECT_MANAGEMENT,
    description: "Delete projects",
  },
  {
    name: "manage_milestones",
    group: PERMISSION_GROUPS.PROJECT_MANAGEMENT,
    description: "Manage project milestones",
  },

  // Service Management
  {
    name: "create_service",
    group: PERMISSION_GROUPS.SERVICE_MANAGEMENT,
    description: "Create new services",
  },
  {
    name: "read_service",
    group: PERMISSION_GROUPS.SERVICE_MANAGEMENT,
    description: "View service details",
  },
  {
    name: "update_service",
    group: PERMISSION_GROUPS.SERVICE_MANAGEMENT,
    description: "Update service information",
  },
  {
    name: "delete_service",
    group: PERMISSION_GROUPS.SERVICE_MANAGEMENT,
    description: "Delete services",
  },

  // Leave Management
  {
    name: "create_leave",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "Create leave applications",
  },
  {
    name: "read_leave",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "View leave applications",
  },
  {
    name: "update_leave",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "Update leave applications",
  },
  {
    name: "approve_leave",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "Approve/reject leave applications",
  },
  {
    name: "delete_leave",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "Delete leave applications",
  },
  {
    name: "manage_leave_types",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "Manage leave types",
  },
  {
    name: "view_team_leaves",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "View team leave applications",
  },
  {
    name: "manage_leave_balance",
    group: PERMISSION_GROUPS.LEAVE_MANAGEMENT,
    description: "Manage leave balances",
  },

  // Blog Management
  {
    name: "create_blog",
    group: PERMISSION_GROUPS.BLOG_MANAGEMENT,
    description: "Create new blogs",
  },
  {
    name: "read_blog",
    group: PERMISSION_GROUPS.BLOG_MANAGEMENT,
    description: "View blog details",
  },
  {
    name: "update_blog",
    group: PERMISSION_GROUPS.BLOG_MANAGEMENT,
    description: "Update blog information",
  },
  {
    name: "delete_blog",
    group: PERMISSION_GROUPS.BLOG_MANAGEMENT,
    description: "Delete blogs",
  },

  // Comment Management
  {
    name: "create_comment",
    group: PERMISSION_GROUPS.COMMENT_MANAGEMENT,
    description: "Create comments",
  },
  {
    name: "read_comment",
    group: PERMISSION_GROUPS.COMMENT_MANAGEMENT,
    description: "View comments",
  },
  {
    name: "update_comment",
    group: PERMISSION_GROUPS.COMMENT_MANAGEMENT,
    description: "Update comments",
  },
  {
    name: "delete_comment",
    group: PERMISSION_GROUPS.COMMENT_MANAGEMENT,
    description: "Delete comments",
  },
  // milestone  management
  {
    name: "create_milestone",
    group: PERMISSION_GROUPS.MILESRONE_MANAGEMENT,
    description: "Create new milestones",
  },
  {
    name: "read_milestone",
    group: PERMISSION_GROUPS.MILESRONE_MANAGEMENT,
    description: "View milestone details",
  },
  {
    name: "update_milestone",
    group: PERMISSION_GROUPS.MILESRONE_MANAGEMENT,
    description: "Update milestone information",
  },
  {
    name: "delete_milestone",
    group: PERMISSION_GROUPS.MILESRONE_MANAGEMENT,
    description: "Delete milestones",
  },
  // task management
  {
    name: "create_task",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Create new tasks",
  },
  {
    name: "read_task",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "View task details",
  },
  {
    name: "update_task",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Update task information",
  },
  {
    name: "delete_task",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Delete tasks",
  },
  {
    name: "assign_task",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Assign tasks to users",
  },
  {
    name: "add_comment",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Add comments to tasks",
  },
  {
    name: "update_comment",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Update comments",
  },
  {
    name: "delete_comment",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Delete comments",
  },
  {
    name: "update_progress",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Update task progress",
  },
  {
    name: "update_time_tracking",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Update task time tracking",
  },
  {
    name: "delete_time_tracking",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Delete task time tracking",
  },
  {
    name: "get_task_stats",
    group: PERMISSION_GROUPS.TASK_MANAGEMENT,
    description: "Get task statistics",
  },

  // Partner Management
  {
    name: "create_partner",
    group: PERMISSION_GROUPS.PARTNER_MANAGEMENT,
    description: "Create new partners",
  },
  {
    name: "read_partner",
    group: PERMISSION_GROUPS.PARTNER_MANAGEMENT,
    description: "View partner details",
  },
  {
    name: "update_partner",
    group: PERMISSION_GROUPS.PARTNER_MANAGEMENT,
    description: "Update partner information",
  },
  {
    name: "delete_partner",
    group: PERMISSION_GROUPS.PARTNER_MANAGEMENT,
    description: "Delete partners",
  },
  {
    name: "toggle_partner_visibility",
    group: PERMISSION_GROUPS.PARTNER_MANAGEMENT,
    description: "Toggle partner visibility",
  },
];
