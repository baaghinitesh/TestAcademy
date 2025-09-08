import connectToDatabase from '../backend/utils/database';
import { User, Class, Subject } from '../backend/models';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Create default admin user (as per requirements)
    const existingAdmin = await User.findOne({ email: 'baaghinitesh@gmail.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'Nitesh',
        email: 'baaghinitesh@gmail.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Default admin user created');
      console.log('📧 Admin Email: baaghinitesh@gmail.com');
      console.log('🔑 Admin Password: admin123');
    } else {
      console.log('ℹ️ Default admin user already exists');
      console.log('📧 Admin Email: baaghinitesh@gmail.com');
      console.log('🔑 Admin Password: admin123');
    }

    // Create demo student user
    const existingStudent = await User.findOne({ email: 'student@example.com' });
    if (!existingStudent) {
      const studentUser = new User({
        name: 'Demo Student',
        email: 'student@example.com',
        password: 'student123',
        role: 'student',
        class: 10,
        enrolledSubjects: ['Mathematics', 'Science', 'English']
      });
      await studentUser.save();
      console.log('✅ Demo student user created');
    } else {
      console.log('ℹ️ Demo student user already exists');
    }

    // Create classes 5-10
    const classNumbers = [5, 6, 7, 8, 9, 10];
    for (const classNum of classNumbers) {
      const existingClass = await Class.findOne({ number: classNum });
      if (!existingClass) {
        const newClass = new Class({
          number: classNum,
          name: `Class ${classNum}`,
          description: `Academic year for students in grade ${classNum}`,
          subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
        });
        await newClass.save();
        console.log(`✅ Class ${classNum} created`);
      }
    }

    // Create subjects
    const subjects = [
      {
        name: 'Mathematics',
        description: 'Mathematics curriculum covering algebra, geometry, and arithmetic',
        classNumbers: [5, 6, 7, 8, 9, 10],
        icon: 'calculator',
        color: '#3b82f6'
      },
      {
        name: 'Science',
        description: 'Science curriculum covering physics, chemistry, and biology',
        classNumbers: [5, 6, 7, 8, 9, 10],
        icon: 'microscope',
        color: '#10b981'
      },
      {
        name: 'English',
        description: 'English language and literature curriculum',
        classNumbers: [5, 6, 7, 8, 9, 10],
        icon: 'book-open',
        color: '#f59e0b'
      },
      {
        name: 'Social Studies',
        description: 'Social studies covering history, geography, and civics',
        classNumbers: [5, 6, 7, 8, 9, 10],
        icon: 'globe',
        color: '#8b5cf6'
      },
      {
        name: 'Hindi',
        description: 'Hindi language curriculum',
        classNumbers: [5, 6, 7, 8, 9, 10],
        icon: 'languages',
        color: '#ef4444'
      }
    ];

    for (const subject of subjects) {
      const existingSubject = await Subject.findOne({ name: subject.name });
      if (!existingSubject) {
        const newSubject = new Subject(subject);
        await newSubject.save();
        console.log(`✅ Subject ${subject.name} created`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👨‍💼 Admin: baaghinitesh@gmail.com / admin123');
    console.log('👨‍🎓 Student: student@example.com / student123');
    console.log('\n🏫 Classes: 5-10 created');
    console.log('📚 Subjects: Mathematics, Science, English, Social Studies, Hindi');
    console.log('\n🌐 You can now access the LMS at http://localhost:3000');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed database:', error);
      process.exit(1);
    });
}

export default seedDatabase;