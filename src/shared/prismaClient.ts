import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client instance with connection pooling configuration
 *
 * Connection pooling is configured via DATABASE_URL environment variable.
 * Example DATABASE_URL format with pooling parameters:
 *
 * postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20
 *
 * Recommended pool settings:
 * - connection_limit: 10-20 (default is typically 5)
 *   Number of concurrent connections in the pool
 * - pool_timeout: 20 (seconds, default is 10)
 *   Maximum time to wait for a connection from the pool
 *
 * For production environments, consider:
 * - Using connection pooler like PgBouncer or Supabase connection pooler
 * - Setting connection_limit based on your server resources and expected load
 * - Monitoring connection usage and adjusting pool size accordingly
 *
 * Note: Prisma uses a connection pool internally. The connection_limit parameter
 * controls the maximum number of connections that Prisma can open simultaneously.
 */
let prisma = new PrismaClient({
  // Optional: Add logging for connection monitoring in development
  // log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export default prisma;
