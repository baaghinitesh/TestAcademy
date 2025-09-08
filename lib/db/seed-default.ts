import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  console.log('\n=== Admin Account Setup ===');
  console.log('Creating default admin account...\n');
  
  const email = 'test@test.com';
  const password = 'admin123';
  const name = 'Admin User';
  
  console.log(`Creating admin account with email: ${email}`);
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        name: name,
      },
    ])
    .returning();

  console.log('\n=== Admin Account Created Successfully ===');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Name: ${name}`);
  console.log('\nYou can now login to the admin panel with these credentials.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });