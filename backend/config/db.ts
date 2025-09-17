import connectToDatabase from '../utils/database';

export { connectToDatabase as default };

// Re-export for compatibility
export const connectDB = connectToDatabase;