import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  test: mongoose.Types.ObjectId;
  question: string;
  questionType: 'single-choice' | 'multiple-choice';
  options: IOption[];
  explanation?: string;
  marks: number;
  order: number;
  isActive: boolean;
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
  isActive: {
    type: Boolean,
    default: true
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
QuestionSchema.index({ isActive: 1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);