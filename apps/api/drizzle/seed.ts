import { db } from '../src/config/database';
import { users } from '../src/features/users/schemas/user.schema';
import bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../src/common/constants';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    const testUserPassword = await bcrypt.hash('Test1234!', BCRYPT_ROUNDS);
    const [testUser] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        password: testUserPassword,
      })
      .returning();

    console.log('✅ Test user created:', testUser.email);

    const adminPassword = await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS);
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@example.com',
        password: adminPassword,
      })
      .returning();

    console.log('✅ Admin user created:', adminUser.email);

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
