import mongoose from 'mongoose';

<<<<<<< HEAD
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:hKiltcQH@127.0.0.1:27017/lms_db?authSource=admin';
=======
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@127.0.0.1:27017/lms_db?authSource=admin';
>>>>>>> main

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectToDatabase;

// Alias for backward compatibility
export const connectDB = connectToDatabase;