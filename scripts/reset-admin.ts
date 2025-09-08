import connectToDatabase from '../backend/utils/database';
import { User } from '../backend/models';

async function resetAdmin() {
  try {
    console.log('🔄 Resetting admin user...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Delete existing admin user
    await User.deleteOne({ email: 'baaghinitesh@gmail.com' });
    console.log('🗑️ Deleted existing admin user');

    // Create new admin user
    const adminUser = new User({
      name: 'Nitesh',
      email: 'baaghinitesh@gmail.com',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ New admin user created');
    console.log('📧 Admin Email: baaghinitesh@gmail.com');
    console.log('🔑 Admin Password: admin123');

  } catch (error) {
    console.error('❌ Error resetting admin user:', error);
    throw error;
  }
}

// Run the reset function if this file is executed directly
if (require.main === module) {
  resetAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to reset admin user:', error);
      process.exit(1);
    });
}

export default resetAdmin;