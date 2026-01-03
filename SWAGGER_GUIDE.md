# Swagger API Documentation Guide

This project now includes Swagger/OpenAPI documentation for all API endpoints. This guide will help you access and use the Swagger UI.

## 🚀 Quick Start

### 1. Start the Development Server

Make sure your server is running:

```bash
pnpm dev
```

The server should start on the port specified in your `.env` file (default is usually `5000`).

### 2. Access Swagger UI

Once the server is running, open your browser and navigate to:

```
http://localhost:5000/api-docs
```

Replace `5000` with your actual port number if different.

### 3. Access Swagger JSON

You can also access the raw OpenAPI JSON specification at:

```
http://localhost:5000/api-docs.json
```

## 📚 Using Swagger UI

### Features

1. **Browse All Endpoints**: View all available API endpoints organized by tags (Auth, Users, Blogs, etc.)

2. **Try It Out**: Click on any endpoint to expand it, then click the "Try it out" button to test the endpoint directly from the browser

3. **Authentication**: 
   - Most endpoints require authentication
   - Use the "Authorize" button (🔒) at the top of the page
   - Enter your JWT token in the format: `Bearer <your-token>`
   - Or use cookie-based authentication (tokens are stored in HTTP-only cookies after login)

4. **Request/Response Examples**: Each endpoint shows example request bodies and response schemas

5. **Filter**: Use the search box to filter endpoints by name or tag

### How to Test Endpoints

1. **For Public Endpoints** (like `/api/v1/auth/login`):
   - Click on the endpoint
   - Click "Try it out"
   - Fill in the required parameters
   - Click "Execute"
   - View the response

2. **For Protected Endpoints**:
   - First, authenticate by logging in via `/api/v1/auth/login`
   - Copy the access token from the response
   - Click the "Authorize" button at the top
   - Enter: `Bearer <your-access-token>`
   - Click "Authorize" and then "Close"
   - Now you can test protected endpoints

3. **For File Upload Endpoints**:
   - Click "Try it out"
   - Use the file picker to select a file
   - Fill in other required fields
   - Execute the request

## 🔐 Authentication Methods

This API supports two authentication methods:

1. **Bearer Token (JWT)**: 
   - Format: `Bearer <token>`
   - Enter in the "Authorize" dialog

2. **Cookie-based Authentication**:
   - Tokens are automatically stored in HTTP-only cookies after login
   - Works automatically in browsers
   - More secure for web applications

## 📝 Adding Documentation to New Routes

To add Swagger documentation to a new route, add JSDoc comments above the route handler:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     tags: [YourTag]
 *     summary: Brief description
 *     description: Detailed description
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/your-endpoint", yourController);
```

## 🎨 Customization

The Swagger configuration is located in `src/config/swagger.ts`. You can customize:

- API title and description
- Server URLs
- Tags and categories
- Common schemas
- Security schemes

## 📋 Available Endpoints

The following modules are documented:

- **Auth**: Authentication and authorization
- **Users**: User management (admin, client, employee)
- **Blogs**: Blog post management
- **Chat**: Real-time chat
- **Contact**: Contact form submissions
- **Leaves**: Leave management
- **Leave Balance**: Employee leave balance
- **Permissions**: Permission management
- **Roles**: Role management
- **Projects**: Project management
- **Project Notes**: Project notes
- **Project Files**: Project file management
- **Milestones**: Milestone tracking
- **Tasks**: Task management
- **Payment**: Payment processing
- **Partner**: Partner management
- **Earnings**: Earnings tracking
- **Expenses**: Expense management
- **Notifications**: Notification management
- **Services**: Service management
- **FAQs**: Frequently asked questions

## 🐛 Troubleshooting

### Swagger UI Not Loading

1. Check that the server is running
2. Verify the port number matches your configuration
3. Check browser console for errors
4. Ensure all dependencies are installed: `pnpm install`

### Endpoints Not Showing

1. Check that JSDoc comments are properly formatted
2. Verify the route files are included in `swagger.ts` configuration:
   ```typescript
   apis: [
     "./src/app/routes/*.ts",
     "./src/app/modules/**/*.routes.ts",
   ]
   ```

### Authentication Not Working

1. Make sure you're logged in first
2. Check that the token format is correct: `Bearer <token>`
3. Verify token hasn't expired
4. For cookie-based auth, ensure cookies are enabled in your browser

## 🔗 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)

## 📞 Support

If you encounter any issues with Swagger documentation, please check:

1. Server logs for errors
2. Browser console for client-side errors
3. Network tab for failed requests

---

**Happy API Testing! 🎉**

