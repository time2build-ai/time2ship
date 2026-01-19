import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { env } from '../config/env';
import logger from '../common/utils/logger';
import path from 'path';

const { Pool } = pg;

/**
 * Run database migrations
 * This should be called on application startup
 */
export async function runMigrations(): Promise<void> {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  });

  const db = drizzle({ client: pool });

  try {
    logger.info('🔄 Running database migrations...');

    // Path to migrations folder relative to this file
    const migrationsFolder = path.join(__dirname, '../../drizzle/migrations');

    await migrate(db, { migrationsFolder });

    logger.info('✅ Database migrations completed successfully');
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
