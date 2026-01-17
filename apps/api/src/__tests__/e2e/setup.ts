import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as userSchema from '@/features/users/schemas/user.schema';
import * as refreshTokenSchema from '@/features/auth/schemas/refresh-token.schema';

/**
 * Test database connection pool.
 * Separate from the main pool to avoid conflicts.
 */
export let testPool: Pool;
export let testDb: ReturnType<typeof drizzle>;

/**
 * Sets up a clean test database before all tests.
 * Creates a fresh database instance and runs migrations.
 */
export async function setupTestDatabase(): Promise<void> {
  testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'time2ship_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  testDb = drizzle(testPool, {
    schema: { ...userSchema, ...refreshTokenSchema },
  });

  // Clean all tables
  await cleanDatabase();
}

/**
 * Tears down the test database after all tests.
 * Closes the connection pool.
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testDb) {
    // Give some time for pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (testPool) {
    await testPool.end();
  }
}

/**
 * Cleans all data from test database tables.
 * Truncates tables to reset auto-increment IDs and remove all data.
 */
export async function cleanDatabase(): Promise<void> {
  if (!testDb) return;

  // Disable foreign key checks temporarily
  await testDb.execute(sql`SET session_replication_role = 'replica';`);

  // Truncate all tables
  await testDb.execute(sql`TRUNCATE TABLE refresh_tokens CASCADE;`);
  await testDb.execute(sql`TRUNCATE TABLE users CASCADE;`);

  // Re-enable foreign key checks
  await testDb.execute(sql`SET session_replication_role = 'origin';`);
}
