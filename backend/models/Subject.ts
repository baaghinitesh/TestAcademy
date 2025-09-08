import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  description?: string;
  classNumbers: number[]; // Which classes this subject is available for
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Subject name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  classNumbers: [{
    type: Number,
    min: 5,
    max: 10,
    required: true
  }],
  icon: {
    type: String,
    default: 'book'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);