import { getSession } from '@/lib/auth/session';
import connectToDatabase from '@/backend/utils/database';
import User from '@/backend/models/User';

export async function getUser() {
  try {
    const sessionData = await getSession();
    
    if (!sessionData || !sessionData.userId) {
      return null;
    }

    await connectToDatabase();
    
    const user = await User.findById(sessionData.userId);
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      profilePicture: user.profilePicture,
      enrolledSubjects: user.enrolledSubjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      profilePicture: user.profilePicture,
      enrolledSubjects: user.enrolledSubjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    await connectToDatabase();
    
    const users = await User.find().sort({ createdAt: -1 });
    
    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      profilePicture: user.profilePicture,
      enrolledSubjects: user.enrolledSubjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function getStudents() {
  try {
    await connectToDatabase();
    
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    
    return students.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      profilePicture: user.profilePicture,
      enrolledSubjects: user.enrolledSubjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function getAdmins() {
  try {
    await connectToDatabase();
    
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    
    return admins.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      profilePicture: user.profilePicture,
      enrolledSubjects: user.enrolledSubjects,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

export async function requireUser() {
  const user = await getUser();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}