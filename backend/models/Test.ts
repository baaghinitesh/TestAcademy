import mongoose, { Schema, Document } from 'mongoose';

export interface ITest extends Document {
  title: string;
  description?: string;
  subject: mongoose.Types.ObjectId;
  classNumber: number;
  chapter?: string;
  duration: number; // in minutes
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string[];
  isActive: boolean;
  isPublished: boolean;
  startTime?: Date;
  endTime?: Date;
  allowedAttempts: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
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
  duration: {
    type: Number,
    required: [true, 'Test duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [300, 'Duration cannot exceed 300 minutes']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: [1, 'Must have at least 1 question']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Must have at least 1 mark']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  instructions: [{
    type: String,
    maxlength: [500, 'Instruction cannot exceed 500 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  allowedAttempts: {
    type: Number,
    default: 1,
    min: [1, 'Must allow at least 1 attempt']
  },
  showResults: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Validation to ensure passing marks is not more than total marks
TestSchema.pre<ITest>('save', function(next) {
  if (this.passingMarks > this.totalMarks) {
    next(new Error('Passing marks cannot be greater than total marks'));
  } else {
    next();
  }
});

// Index for better query performance
TestSchema.index({ subject: 1, classNumber: 1 });
TestSchema.index({ isActive: 1, isPublished: 1 });

export default mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);