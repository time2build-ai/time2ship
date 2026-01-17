import { pgTable, uuid, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 255 }).notNull(), // bcrypt hashed
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  resetToken: varchar('reset_token', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_password_resets_email').on(table.email),
  expiresAtIdx: index('idx_password_resets_expires_at').on(table.expiresAt),
  resetTokenIdx: index('idx_password_resets_reset_token').on(table.resetToken),
}));

export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
