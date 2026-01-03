import swaggerJsdoc from "swagger-jsdoc";
import config from "./config";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Company Site Backend API",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for Company Site Backend. This API provides endpoints for user management, authentication, projects, tasks, payments, and more.",
      contact: {
        name: "API Support",
        email: config.admin_email || "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port || 5000}`,
        description: "Development server",
      },
      {
        url: "https://api.waywisetech.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token obtained from login endpoint",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT token stored in HTTP-only cookie",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  example: "/api/v1/users",
                },
                error: {
                  type: "string",
                  example: "Detailed error message",
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
            },
            meta: {
              type: "object",
              properties: {
                page: {
                  type: "number",
                  example: 1,
                },
                limit: {
                  type: "number",
                  example: 10,
                },
                total: {
                  type: "number",
                  example: 100,
                },
                totalPages: {
                  type: "number",
                  example: 10,
                },
              },
            },
          },
        },
        PaginationQuery: {
          type: "object",
          properties: {
            page: {
              type: "number",
              example: 1,
              description: "Page number (default: 1)",
            },
            limit: {
              type: "number",
              example: 10,
              description: "Items per page (default: 10)",
            },
            sortBy: {
              type: "string",
              example: "createdAt",
              description: "Field to sort by",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              example: "desc",
              description: "Sort order",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Admin",
        description: "Admin-specific operations",
      },
      {
        name: "Blogs",
        description: "Blog post management",
      },
      {
        name: "Chat",
        description: "Real-time chat functionality",
      },
      {
        name: "Contact",
        description: "Contact form submissions",
      },
      {
        name: "Leaves",
        description: "Leave management",
      },
      {
        name: "Leave Balance",
        description: "Employee leave balance tracking",
      },
      {
        name: "Permissions",
        description: "Permission management",
      },
      {
        name: "Roles",
        description: "Role management",
      },
      {
        name: "Projects",
        description: "Project management",
      },
      {
        name: "Project Notes",
        description: "Project notes management",
      },
      {
        name: "Project Files",
        description: "Project file management",
      },
      {
        name: "Milestones",
        description: "Project milestone tracking",
      },
      {
        name: "Tasks",
        description: "Task management",
      },
      {
        name: "Payment",
        description: "Payment processing",
      },
      {
        name: "Partner",
        description: "Partner management",
      },
      {
        name: "Earnings",
        description: "Earnings tracking",
      },
      {
        name: "Expenses",
        description: "Expense management",
      },
      {
        name: "Notifications",
        description: "Notification management",
      },
      {
        name: "Services",
        description: "Service management",
      },
      {
        name: "FAQs",
        description: "Frequently asked questions",
      },
      {
        name: "Live Projects",
        description: "Live project management",
      },
    ],
  },
  apis: [
    "./src/app/routes/*.ts",
    "./src/app/modules/**/*.routes.ts",
    "./src/app/modules/**/*.controller.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

