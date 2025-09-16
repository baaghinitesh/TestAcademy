import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITestEnhanced extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterId?: Types.ObjectId;
  topicId?: Types.ObjectId;
  
  // Enhanced Test Configuration
  testType: 'practice' | 'assessment' | 'mock' | 'quiz' | 'final';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  timeLimit: number; // in minutes
  passingScore: number; // percentage
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  allowReview: boolean;
  
  // Question Configuration
  questions: Array<{
    questionId: Types.ObjectId;
    points: number;
    timeLimit?: number; // individual question time limit
    isRequired: boolean;
    order: number;
  }>;
  totalQuestions: number;
  totalPoints: number;
  
  // Advanced Settings
  instructions: string;
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  
  // Scheduling
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  
  // Analytics
  analytics: {
    totalAttempts: number;
    averageScore: number;
    averageTimeSpent: number;
    passRate: number;
    questionStats: Array<{
      questionId: Types.ObjectId;
      correctAttempts: number;
      totalAttempts: number;
      averageTime: number;
      skipCount: number;
    }>;
  };
  
  // Metadata
  createdBy: {
    userId: Types.ObjectId;
    name: string;
    email: string;
  };
  updatedBy?: {
    userId: Types.ObjectId;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const TestEnhancedSchema = new Schema<ITestEnhanced>({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 1000
  },
  classId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true,
    index: true
  },
  subjectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true,
    index: true
  },
  chapterId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Chapter',
    index: true
  },
  topicId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Topic',
    index: true
  },
  
  // Enhanced Test Configuration
  testType: {
    type: String,
    enum: ['practice', 'assessment', 'mock', 'quiz', 'final'],
    default: 'practice',
    index: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
    default: 'mixed',
    index: true
  },
  timeLimit: {
    type: Number,
    required: true,
    min: 1,
    max: 480 // 8 hours max
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 60
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  
  // Question Configuration
  questions: [{
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionEnhanced',
      required: true
    },
    points: {
      type: Number,
      required: true,
      min: 0.5,
      max: 100
    },
    timeLimit: {
      type: Number,
      min: 30,
      max: 1800 // 30 minutes max per question
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  totalQuestions: {
    type: Number,
    default: 0,
    min: 1
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Advanced Settings
  instructions: {
    type: String,
    default: '',
    maxlength: 2000
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningObjectives: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Scheduling
  startDate: {
    type: Date,
    index: true
  },
  endDate: {
    type: Date,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Analytics
  analytics: {
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    questionStats: [{
      questionId: { type: Schema.Types.ObjectId, ref: 'QuestionEnhanced' },
      correctAttempts: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      averageTime: { type: Number, default: 0 },
      skipCount: { type: Number, default: 0 }
    }]
  },
  
  // Metadata
  createdBy: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  updatedBy: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'testsEnhanced'
});

// Indexes for performance
TestEnhancedSchema.index({ classId: 1, subjectId: 1, testType: 1 });
TestEnhancedSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
TestEnhancedSchema.index({ 'createdBy.userId': 1, createdAt: -1 });
TestEnhancedSchema.index({ difficulty: 1, testType: 1, totalQuestions: 1 });

// Pre-save middleware
TestEnhancedSchema.pre('save', function(this: ITestEnhanced, next) {
  // Calculate totals
  this.totalQuestions = this.questions.length;
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  
  // Validate date range
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    throw new Error('Start date must be before end date');
  }
  
  // Increment version
  this.version += 1;
  
  next();
});

// Instance methods
TestEnhancedSchema.methods.calculatePassRate = function(this: ITestEnhanced) {
  const stats = this.analytics;
  return stats.totalAttempts > 0 ? (stats.passRate * 100).toFixed(1) : '0.0';
};

TestEnhancedSchema.methods.isAvailable = function(this: ITestEnhanced) {
  const now = new Date();
  const isScheduled = (!this.startDate || now >= this.startDate) && 
                     (!this.endDate || now <= this.endDate);
  return this.isActive && isScheduled;
};

TestEnhancedSchema.methods.getDifficultyStats = function(this: ITestEnhanced) {
  // This would need to aggregate from linked questions
  return {
    beginner: 0,
    intermediate: 0,
    advanced: 0
  };
};

// Static methods
TestEnhancedSchema.statics.findByHierarchy = function(
  classId: string, 
  subjectId?: string, 
  chapterId?: string, 
  topicId?: string
) {
  const filter: any = { classId, isActive: true };
  if (subjectId) filter.subjectId = subjectId;
  if (chapterId) filter.chapterId = chapterId;
  if (topicId) filter.topicId = topicId;
  
  return this.find(filter)
    .populate('questions.questionId', 'question difficulty type')
    .sort({ createdAt: -1 });
};

TestEnhancedSchema.statics.getAnalyticsData = function(testIds: string[]) {
  return this.aggregate([
    { $match: { _id: { $in: testIds.map(id => new mongoose.Types.ObjectId(id)) } } },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        totalAttempts: { $sum: '$analytics.totalAttempts' },
        averageScore: { $avg: '$analytics.averageScore' },
        averagePassRate: { $avg: '$analytics.passRate' }
      }
    }
  ]);
};

TestEnhancedSchema.statics.findSimilar = function(
  testId: string, 
  limit: number = 5
) {
  return this.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(testId) } },
    {
      $lookup: {
        from: 'testsEnhanced',
        let: { 
          classId: '$classId', 
          subjectId: '$subjectId',
          difficulty: '$difficulty',
          testType: '$testType'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$classId', '$$classId'] },
                  { $eq: ['$subjectId', '$$subjectId'] },
                  { $eq: ['$difficulty', '$$difficulty'] },
                  { $ne: ['$_id', new mongoose.Types.ObjectId(testId)] },
                  { $eq: ['$isActive', true] }
                ]
              }
            }
          },
          { $limit: limit },
          { $sort: { 'analytics.totalAttempts': -1 } }
        ],
        as: 'similarTests'
      }
    },
    { $project: { similarTests: 1 } }
  ]);
};

export default mongoose.models.TestEnhanced || mongoose.model<ITestEnhanced>('TestEnhanced', TestEnhancedSchema);