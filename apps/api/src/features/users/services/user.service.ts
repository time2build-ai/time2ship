import { db } from '@/config/database';
import { users } from '../schemas/user.schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { AppError, NotFoundError } from '@/common/utils/errors';
import { BCRYPT_ROUNDS } from '@/common/constants';
import { PaginationHelper, PaginationParams } from '@/common/helpers/pagination';
import { USER_ERROR_CODES } from '../constants/error-codes';

export class UserService {
  async create(email: string, password: string): Promise<Omit<typeof users.$inferSelect, 'password'>> {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
      })
      .returning();

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(params: PaginationParams) {
    const { page, limit, offset } = PaginationHelper.parseParams(params);

    // Fetch users and total count in parallel
    const [userList, totalResult] = await Promise.all([
      db.select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users).limit(limit).offset(offset),

      db.select({ count: sql<number>`count(*)` }).from(users),
    ]);

    const meta = PaginationHelper.buildMeta(page, limit, totalResult[0].count);

    return { users: userList, meta };
  }

  async findById(id: string): Promise<Omit<typeof users.$inferSelect, 'password'>> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        password: false, // Don't return password
      },
    });

    if (!user) {
      throw new NotFoundError('User', USER_ERROR_CODES.NOT_FOUND);
    }

    return user;
  }

  async findByEmail(email: string): Promise<typeof users.$inferSelect> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async update(
    id: string,
    data: { email?: string; password?: string }
  ): Promise<Omit<typeof users.$inferSelect, 'password'>> {
    await this.findById(id);

    const updates: any = { updatedAt: new Date() };
    if (data.email) updates.email = data.email;
    if (data.password) updates.password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await db.delete(users).where(eq(users.id, id));
  }
}

export const userService = new UserService();
