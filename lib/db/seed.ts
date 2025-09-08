import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';
import * as readline from 'readline';

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function seed() {
  console.log('\n=== Admin Account Setup ===');
  console.log('Please enter admin credentials (or press Enter for defaults):\n');
  
  const emailInput = await askQuestion('Admin Email (default: test@test.com): ');
  const passwordInput = await askQuestion('Admin Password (default: admin123): ');
  const nameInput = await askQuestion('Admin Name (default: Admin User): ');
  
  const email = emailInput.trim() || 'test@test.com';
  const password = passwordInput.trim() || 'admin123';
  const name = nameInput.trim() || 'Admin User';
  
  console.log(`\nCreating admin account with email: ${email}`);
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