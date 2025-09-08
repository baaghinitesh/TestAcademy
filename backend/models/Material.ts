import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'document' | 'image';
  filePath: string;
  fileName: string;
  fileSize: number;
  subject: mongoose.Types.ObjectId;
  classNumber: number;
  chapter?: string;
  topic?: string;
  downloadable: boolean; // Controls if direct download is allowed
  viewable: boolean; // Controls if file can be viewed inline
  uploadedBy: mongoose.Types.ObjectId;
  viewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'document', 'image'],
    required: [true, 'Material type is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size must be positive']
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  classNumber: {
    type: Number,
    required: [true, 'Class number is required'],
    min: [5, 'Class must be between 5 and 10'],
    max: [10, 'Class must be between 5 and 10']
  },
  chapter: {
    type: String,
    maxlength: [100, 'Chapter name cannot exceed 100 characters']
  },
  topic: {
    type: String,
    maxlength: [100, 'Topic name cannot exceed 100 characters']
  },
  downloadable: {
    type: Boolean,
    default: false
  },
  viewable: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
MaterialSchema.index({ subject: 1, classNumber: 1 });
MaterialSchema.index({ isActive: 1 });

export default mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);