import mongoose, { Schema, Document } from 'mongoose';

// Enhanced Option interface with comprehensive features
export interface IOptionEnhanced {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
  imageUploadType?: 'url' | 'upload';
  explanation?: string; // Individual option explanation
  order: number; // For consistent ordering
}

// Enhanced Question interface for hierarchical organization
export interface IQuestionEnhanced extends Document {
  // Basic question information
  question: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'fill-blank' | 'numerical';
  options: IOptionEnhanced[];
  
  // Enhanced hierarchical structure - Class → Subject → Chapter → Topic → Subtopic
  classNumber: number;
  subject: mongoose.Types.ObjectId;
  chapter: string; // Required for proper hierarchy
  topic: string; // Required for proper hierarchy
  subtopic?: string; // Optional for more granular organization
  
  // Enhanced explanation system
  explanation?: string;
  explanationImageUrl?: string;
  explanationImageUploadType?: 'url' | 'upload';
  hint?: string;
  hintImageUrl?: string;
  
  // Question scoring and difficulty
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // seconds to solve
  
  // Enhanced image management
  questionImageUrl?: string;
  questionImageUploadType?: 'url' | 'upload';
  hasImage: boolean;
  hasExplanation: boolean;
  hasHint: boolean;
  
  // Enhanced metadata for high-volume management
  tags: string[];
  source?: string; // Book/reference source
  yearCreated?: number;
  language: string;
  
  // Test association (optional - for standalone questions)
  test?: mongoose.Types.ObjectId;
  order?: number; // Order within test
  
  // Performance and analytics
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  
  // Usage analytics for optimization
  usageCount: number;
  correctAnswerRate: number; // Percentage of correct answers
  avgTimeSpent: number; // Average time students spend
  lastUsed?: Date;
  
  // Bulk management and tracking
  batchId?: string; // For tracking bulk uploads
  importSource?: string; // CSV, API, Manual
  csvRowNumber?: number; // Track original CSV row for debugging
  
  // Auto-test creation flags
  autoTestEligible: boolean; // Can this question be included in auto-generated tests
  testTypes: string[]; // Types of tests this question is suitable for ['practice', 'exam', 'quiz']
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Option Schema
const OptionEnhancedSchema: Schema = new Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [1000, 'Option text cannot exceed 1000 characters']
  },
  isCorrect: {
    type: Boolean,
    default: false,
    index: true // For efficient querying of correct answers
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  },
  imageUploadType: {
    type: String,
    enum: ['url', 'upload'],
    default: 'url'
  },
  explanation: {
    type: String,
    maxlength: [500, 'Option explanation cannot exceed 500 characters'],
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: [1, 'Option order must be at least 1']
  }
});

// Enhanced Question Schema with proper indexing for high-volume queries
const QuestionEnhancedSchema: Schema = new Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [5000, 'Question cannot exceed 5000 characters'],
    index: 'text' // Full text search support
  },
  questionType: {
    type: String,
    enum: ['single-choice', 'multiple-choice', 'true-false', 'fill-blank', 'numerical'],
    required: [true, 'Question type is required'],
    default: 'single-choice',
    index: true
  },
  options: {
    type: [OptionEnhancedSchema],
    required: [true, 'Options are required'],
    validate: {
      validator: function(options: IOptionEnhanced[]) {
        if (this.questionType === 'true-false') {
          return options.length === 2;
        }
        return options.length >= 2 && options.length <= 8;
      },
      message: 'Invalid number of options for question type'
    }
  },
  
  // Enhanced hierarchical structure with compound indexing
  classNumber: {
    type: Number,
    required: [true, 'Class number is required'],
    min: [5, 'Class must be between 5 and 12'],
    max: [12, 'Class must be between 5 and 12'],
    index: true
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
    index: true
  },
  chapter: {
    type: String,
    required: [true, 'Chapter is required for proper organization'],
    trim: true,
    maxlength: [100, 'Chapter name cannot exceed 100 characters'],
    index: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required for proper organization'],
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters'],
    index: true
  },
  subtopic: {
    type: String,
    trim: true,
    maxlength: [100, 'Subtopic name cannot exceed 100 characters'],
    index: true
  },
  
  // Enhanced explanation system
  explanation: {
    type: String,
    maxlength: [3000, 'Explanation cannot exceed 3000 characters'],
    trim: true
  },
  explanationImageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i.test(v);
      },
      message: 'Invalid explanation image URL format'
    }
  },
  explanationImageUploadType: {
    type: String,
    enum: ['url', 'upload'],
    default: 'url'
  },
  hint: {
    type: String,
    maxlength: [500, 'Hint cannot exceed 500 characters'],
    trim: true
  },
  hintImageUrl: {
    type: String,
    trim: true
  },
  
  // Question scoring and difficulty
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0.5, 'Minimum marks is 0.5'],
    max: [20, 'Maximum marks is 20'],
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required'],
    default: 'medium',
    index: true
  },
  estimatedTime: {
    type: Number,
    default: 60, // 60 seconds default
    min: [10, 'Minimum time is 10 seconds'],
    max: [600, 'Maximum time is 10 minutes']
  },
  
  // Enhanced image management
  questionImageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i.test(v);
      },
      message: 'Invalid question image URL format'
    }
  },
  questionImageUploadType: {
    type: String,
    enum: ['url', 'upload'],
    default: 'url'
  },
  hasImage: {
    type: Boolean,
    default: false,
    index: true // For filtering questions with images
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
    maxlength: [200, 'Source cannot exceed 200 characters'],
    trim: true
  },
  yearCreated: {
    type: Number,
    min: [1900, 'Year cannot be before 1900'],
    max: [new Date().getFullYear() + 5, 'Year cannot be too far in the future']
  },
  language: {
    type: String,
    default: 'English',
    enum: ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu']
  },
  
  // Test association (optional)
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    index: true
  },
  order: {
    type: Number,
    min: [1, 'Order must be at least 1']
  },
  
  // Performance and management fields
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
    min: [0, 'Usage count cannot be negative']
  },
  correctAnswerRate: {
    type: Number,
    default: 0,
    min: [0, 'Rate cannot be negative'],
    max: [100, 'Rate cannot exceed 100']
  },
  avgTimeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time cannot be negative']
  },
  lastUsed: {
    type: Date
  },
  
  // Bulk management
  batchId: {
    type: String,
    index: true // For efficient bulk operation queries
  },
  importSource: {
    type: String,
    enum: ['CSV', 'API', 'Manual', 'Import'],
    default: 'Manual'
  },
  csvRowNumber: {
    type: Number,
    min: [1, 'Row number must be at least 1']
  },
  
  // Auto-test creation
  autoTestEligible: {
    type: Boolean,
    default: true,
    index: true
  },
  testTypes: [{
    type: String,
    enum: ['practice', 'exam', 'quiz', 'mock-test', 'chapter-test']
  }],
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient hierarchical queries
QuestionEnhancedSchema.index({ classNumber: 1, subject: 1, chapter: 1, topic: 1 });
QuestionEnhancedSchema.index({ subject: 1, classNumber: 1, difficulty: 1 });
QuestionEnhancedSchema.index({ batchId: 1, createdAt: -1 });
QuestionEnhancedSchema.index({ isActive: 1, isVerified: 1 });
QuestionEnhancedSchema.index({ tags: 1 });
QuestionEnhancedSchema.index({ usageCount: -1 });
QuestionEnhancedSchema.index({ correctAnswerRate: 1 });

// Pre-save middleware for validation and auto-field updates
QuestionEnhancedSchema.pre<IQuestionEnhanced>('save', function(next) {
  // Validate correct answers based on question type
  const correctOptions = this.options.filter(option => option.isCorrect);
  
  if (this.questionType === 'single-choice' && correctOptions.length !== 1) {
    return next(new Error('Single-choice questions must have exactly one correct answer'));
  }
  
  if (this.questionType === 'multiple-choice' && correctOptions.length < 1) {
    return next(new Error('Multiple-choice questions must have at least one correct answer'));
  }
  
  if (this.questionType === 'true-false') {
    if (this.options.length !== 2 || correctOptions.length !== 1) {
      return next(new Error('True/false questions must have exactly 2 options with 1 correct answer'));
    }
  }
  
  // Update helper fields
  this.hasImage = !!(this.questionImageUrl || this.options.some(opt => opt.imageUrl));
  this.hasExplanation = !!this.explanation;
  this.hasHint = !!this.hint;
  
  // Set default test types if not provided
  if (!this.testTypes || this.testTypes.length === 0) {
    this.testTypes = ['practice', 'quiz'];
  }
  
  // Ensure option ordering
  this.options.forEach((option, index) => {
    if (!option.order) {
      option.order = index + 1;
    }
  });
  
  next();
});

// Static methods for efficient querying
QuestionEnhancedSchema.statics.findByHierarchy = function(classNumber: number, subjectId: string, chapter?: string, topic?: string) {
  const query: any = { classNumber, subject: subjectId, isActive: true };
  if (chapter) query.chapter = chapter;
  if (topic) query.topic = topic;
  return this.find(query);
};

QuestionEnhancedSchema.statics.findForAutoTest = function(classNumber: number, subjectId: string, difficulty?: string, limit = 20) {
  const query: any = { 
    classNumber, 
    subject: subjectId, 
    isActive: true, 
    isVerified: true, 
    autoTestEligible: true 
  };
  if (difficulty) query.difficulty = difficulty;
  return this.find(query).limit(limit).sort({ usageCount: 1 }); // Prefer less used questions
};

QuestionEnhancedSchema.statics.getBulkUploadStats = function(batchId: string) {
  return this.aggregate([
    { $match: { batchId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byDifficulty: {
          $push: {
            difficulty: '$difficulty',
            count: { $sum: 1 }
          }
        },
        byChapter: {
          $push: {
            chapter: '$chapter',
            count: { $sum: 1 }
          }
        },
        avgMarks: { $avg: '$marks' },
        withImages: { $sum: { $cond: ['$hasImage', 1, 0] } },
        withExplanations: { $sum: { $cond: ['$hasExplanation', 1, 0] } }
      }
    }
  ]);
};

export default mongoose.models.QuestionEnhancedV2 || mongoose.model<IQuestionEnhanced>('QuestionEnhancedV2', QuestionEnhancedSchema);