import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface IQuestion extends Document {
  test: mongoose.Types.ObjectId;
  question: string;
  questionType: 'single-choice' | 'multiple-choice';
  options: IOption[];
  explanation?: string;
  marks: number;
  order: number;
  subject: mongoose.Types.ObjectId;
  classNumber: number;
  chapter?: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionImageUrl?: string;
  explanationImageUrl?: string;
  tags: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema: Schema = new Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [500, 'Option text cannot exceed 500 characters']
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    trim: true
  }
});

const QuestionSchema: Schema = new Schema({
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test reference is required']
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [2000, 'Question cannot exceed 2000 characters']
  },
  questionType: {
    type: String,
    enum: ['single-choice', 'multiple-choice'],
    required: [true, 'Question type is required'],
    default: 'single-choice'
  },
  options: {
    type: [OptionSchema],
    required: [true, 'Options are required'],
    validate: {
      validator: function(options: IOption[]) {
        return options.length >= 2 && options.length <= 6;
      },
      message: 'Question must have between 2 and 6 options'
    }
  },
  explanation: {
    type: String,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0.5, 'Minimum marks is 0.5'],
    max: [10, 'Maximum marks is 10']
  },
  order: {
    type: Number,
    required: [true, 'Question order is required'],
    min: [1, 'Order must be at least 1']
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
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required'],
    default: 'medium'
  },
  questionImageUrl: {
    type: String,
    trim: true
  },
  explanationImageUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

// Custom validation to ensure at least one correct answer for single-choice
// and at least one correct answer for multiple-choice
QuestionSchema.pre<IQuestion>('save', function(next) {
  const correctOptions = this.options.filter(option => option.isCorrect);
  
  if (this.questionType === 'single-choice' && correctOptions.length !== 1) {
    next(new Error('Single-choice questions must have exactly one correct answer'));
  } else if (this.questionType === 'multiple-choice' && correctOptions.length < 1) {
    next(new Error('Multiple-choice questions must have at least one correct answer'));
  } else {
    next();
  }
});

// Index for better query performance
QuestionSchema.index({ test: 1, order: 1 });
QuestionSchema.index({ subject: 1, classNumber: 1 });
QuestionSchema.index({ subject: 1, classNumber: 1, chapter: 1 });
QuestionSchema.index({ subject: 1, classNumber: 1, topic: 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ isActive: 1 });
QuestionSchema.index({ createdBy: 1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);