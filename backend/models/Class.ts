import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  number: number; // 5-10
  name: string;
  description?: string;
  subjects: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema: Schema = new Schema({
  number: {
    type: Number,
    required: [true, 'Class number is required'],
    unique: true,
    min: [5, 'Class must be between 5 and 10'],
    max: [10, 'Class must be between 5 and 10']
  },
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subjects: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);