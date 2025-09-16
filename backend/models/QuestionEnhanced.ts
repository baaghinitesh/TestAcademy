import mongoose, { Schema, Document } from 'mongoose';

// Enhanced Option interface with image support and explanations
export interface IOptionEnhanced {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
  imageUploadType?: 'url' | 'upload'; // Track how image was added
  explanation?: string; // Individual option explanation
}

// Enhanced Question interface for high-volume management
export interface IQuestionEnhanced extends Document {
  test?: mongoose.Types.ObjectId; // Made optional for standalone questions
  question: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'fill-blank';
  options: IOptionEnhanced[];
  
  // Enhanced explanation system
  explanation?: string;
  explanationImageUrl?: string;
  explanationImageUploadType?: 'url' | 'upload';
  hint?: string; // Short hint before showing full explanation
  hintImageUrl?: string;
  
  // Enhanced categorization
  marks: number;
  order?: number; // Optional for standalone questions
  subject: mongoose.Types.ObjectId;
  classNumber: number;
  chapter?: string;
  topic?: string;
  subtopic?: string; // Added for more granular organization
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Enhanced image management
  questionImageUrl?: string;
  questionImageUploadType?: 'url' | 'upload';
  hasImage: boolean; // Quick filter field
  hasExplanation: boolean; // Quick filter field
  hasHint: boolean; // Quick filter field
  
  // Enhanced metadata for high-volume management
  tags: string[];
  source?: string; // Book/reference source
  yearCreated?: number;
  language: string;
  estimatedTime: number; // seconds to solve
  
  // Performance and management fields
  isActive: boolean;
  isVerified: boolean; // Quality control flag
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  
  // Usage analytics for optimization
  usageCount: number;
  correctAnswerRate: number; // Percentage of correct answers
  avgTimeSpent: number; // Average time students spend
  lastUsed?: Date;
  
  // Bulk management
  batchId?: string; // For tracking bulk uploads
  importSource?: string; // CSV, API, Manual
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OptionEnhancedSchema: Schema = new Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [1000, 'Option text cannot exceed 1000 characters']
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imageUploadType: {
    type: String,
    enum: ['url', 'upload'],
    default: 'url'
  },
  explanation: {
    type: String,
    maxlength: [500, 'Option explanation cannot exceed 500 characters']
  }
});

const QuestionEnhancedSchema: Schema = new Schema({
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    index: true // For efficient test-based queries
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [3000, 'Question cannot exceed 3000 characters'],
    index: 'text' // Full text search
  },
  questionType: {
    type: String,
    enum: ['single-choice', 'multiple-choice', 'true-false', 'fill-blank'],
    required: [true, 'Question type is required'],
    default: 'single-choice',
    index: true
  },
  options: {
    type: [OptionEnhancedSchema],
    required: [true, 'Options are required'],
    validate: {
      validator: function(options: IOptionEnhanced[]) {
        return options.length >= 2 && options.length <= 8;
      },
      message: 'Question must have between 2 and 8 options'
    }
  },
  
  // Enhanced explanation system
  explanation: {
    type: String,
    maxlength: [2000, 'Explanation cannot exceed 2000 characters']
  },
  explanationImageUrl: {
    type: String,
    trim: true
  },
  explanationImageUploadType: {
    type: String,
    enum: ['url', 'upload'],
    default: 'url'
  },
  hint: {
    type: String,
    maxlength: [500, 'Hint cannot exceed 500 characters']
  },
  hintImageUrl: {
    type: String,
    trim: true
  },
  
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0.25, 'Minimum marks is 0.25'],
    max: [20, 'Maximum marks is 20']
  },
  order: {
    type: Number,
    min: [1, 'Order must be at least 1']
  },
  
  // Enhanced categorization with compound indexes
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
    index: true
  },
  classNumber: {
    type: Number,
    required: [true, 'Class number is required'],
    min: [5, 'Class must be between 5 and 12'],
    max: [12, 'Class must be between 5 and 12'],
    index: true
  },
  chapter: {
    type: String,
    maxlength: [100, 'Chapter name cannot exceed 100 characters'],
    index: true
  },
  topic: {
    type: String,
    maxlength: [100, 'Topic name cannot exceed 100 characters'],
    index: true
  },
  subtopic: {
    type: String,
    maxlength: [100, 'Subtopic name cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required'],
    default: 'medium',
    index: true
  },
  
  // Enhanced image management
  questionImageUrl: {
    type: String,
    trim: true
  },
  questionImageUploadType: {
    type: String,
    enum: ['url', 'upload'],
    default: 'url'
  },
  hasImage: {
    type: Boolean,
    default: false,
    index: true // For quick filtering
  },
  hasExplanation: {
    type: Boolean,
    default: false,
    index: true
  },
  hasHint: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Enhanced metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  source: {
    type: String,
    maxlength: [200, 'Source cannot exceed 200 characters']
  },
  yearCreated: {
    type: Number,
    min: [1990, 'Year must be after 1990'],
    max: [new Date().getFullYear() + 10, 'Year cannot be too far in future']
  },
  language: {
    type: String,
    default: 'en',
    maxlength: [10, 'Language code cannot exceed 10 characters']
  },
  estimatedTime: {
    type: Number,
    default: 60, // 1 minute default
    min: [10, 'Minimum time is 10 seconds'],
    max: [1800, 'Maximum time is 30 minutes']
  },
  
  // Performance and management
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  
  // Usage analytics
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  correctAnswerRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  avgTimeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  },
  
  // Bulk management
  batchId: {
    type: String,
    maxlength: [100, 'Batch ID cannot exceed 100 characters'],
    index: true
  },
  importSource: {
    type: String,
    enum: ['csv', 'api', 'manual', 'migration'],
    default: 'manual'
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries on large datasets
QuestionEnhancedSchema.index({ subject: 1, classNumber: 1, chapter: 1, difficulty: 1 });
QuestionEnhancedSchema.index({ isActive: 1, isVerified: 1, subject: 1 });
QuestionEnhancedSchema.index({ hasImage: 1, hasExplanation: 1, hasHint: 1 });
QuestionEnhancedSchema.index({ usageCount: -1, correctAnswerRate: -1 });
QuestionEnhancedSchema.index({ createdAt: -1, batchId: 1 });

// Text search index for question content
QuestionEnhancedSchema.index({ 
  question: 'text', 
  'options.text': 'text', 
  explanation: 'text',
  tags: 'text'
});

// Pre-save middleware to update computed fields
QuestionEnhancedSchema.pre<IQuestionEnhanced>('save', function(next) {
  // Update hasImage field
  this.hasImage = !!(this.questionImageUrl || 
    this.options.some(opt => opt.imageUrl) ||
    this.explanationImageUrl ||
    this.hintImageUrl);
  
  // Update hasExplanation field
  this.hasExplanation = !!(this.explanation || this.options.some(opt => opt.explanation));
  
  // Update hasHint field
  this.hasHint = !!(this.hint);
  
  // Validate correct answers based on question type
  const correctOptions = this.options.filter(option => option.isCorrect);
  
  if (this.questionType === 'single-choice' && correctOptions.length !== 1) {
    next(new Error('Single-choice questions must have exactly one correct answer'));
  } else if (this.questionType === 'multiple-choice' && correctOptions.length < 1) {
    next(new Error('Multiple-choice questions must have at least one correct answer'));
  } else if (this.questionType === 'true-false' && this.options.length !== 2) {
    next(new Error('True-false questions must have exactly two options'));
  } else {
    next();
  }
});

// Static method for bulk operations
QuestionEnhancedSchema.statics.bulkCreateWithValidation = async function(questions: any[], batchId: string) {
  const validQuestions = [];
  const errors = [];
  
  for (let i = 0; i < questions.length; i++) {
    try {
      const question = new this({ ...questions[i], batchId });
      await question.validate();
      validQuestions.push(question);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }
  
  if (validQuestions.length > 0) {
    await this.insertMany(validQuestions, { ordered: false });
  }
  
  return {
    created: validQuestions.length,
    errors: errors,
    batchId: batchId
  };
};

export default mongoose.models.QuestionEnhanced || mongoose.model<IQuestionEnhanced>('QuestionEnhanced', QuestionEnhancedSchema);