import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as userSchema from '@/features/users/schemas/user.schema';
import * as refreshTokenSchema from '@/features/auth/schemas/refresh-token.schema';
import * as passwordResetSchema from '@/features/auth/schemas/password-reset.schema';

/**
 * PostgreSQL connection pool for database queries.
 * Configured using environment variables from validated env config.
 */
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

/**
 * Drizzle ORM database instance.
 * Use this to perform all database operations.
 *
 * @example
 * import { db } from '@/config/database';
 * const users = await db.query.users.findMany();
 */
export const db = drizzle(pool, {
  schema: { ...userSchema, ...refreshTokenSchema, ...passwordResetSchema },
});
