import connectToDatabase from '../utils/database';

export { connectToDatabase as default };
export { connectDB } from '../utils/database';

// Re-export for compatibility
export const connectDB = connectToDatabase;