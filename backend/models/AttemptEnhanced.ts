import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttemptEnhanced extends Document {
  _id: Types.ObjectId;
  testId: Types.ObjectId;
  userId: Types.ObjectId;
  attemptNumber: number;
  
  // Attempt Status
  status: 'in_progress' | 'completed' | 'submitted' | 'expired' | 'abandoned';
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  ipAddress?: string;
  userAgent?: string;
  
  // Question Responses
  responses: Array<{
    questionId: Types.ObjectId;
    selectedAnswers: string[]; // Support multiple selections
    textAnswer?: string; // For text-based questions
    timeSpent: number;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    isSkipped: boolean;
    flagged: boolean;
    visitCount: number;
    explanation?: string; // Auto-generated explanation
    hint?: string; // Hint that was shown (if any)
    reviewNote?: string; // Student's review note
  }>;
  
  // Scoring Details
  score: {
    totalPoints: number;
    maxPoints: number;
    percentage: number;
    grade: string; // A+, A, B+, B, C+, C, D, F
    isPassed: boolean;
    breakdown: {
      correct: number;
      incorrect: number;
      skipped: number;
      flagged: number;
    };
    difficultyBreakdown: {
      beginner: { correct: number; total: number; percentage: number };
      intermediate: { correct: number; total: number; percentage: number };
      advanced: { correct: number; total: number; percentage: number };
    };
    topicBreakdown: Array<{
      topicId: Types.ObjectId;
      topicName: string;
      correct: number;
      total: number;
      percentage: number;
    }>;
  };
  
  // Performance Analytics
  performance: {
    averageTimePerQuestion: number;
    fastestQuestion: { questionId: Types.ObjectId; time: number };
    slowestQuestion: { questionId: Types.ObjectId; time: number };
    accuracy: number;
    consistencyScore: number; // How consistent the performance was
    improvementAreas: string[];
    strengths: string[];
  };
  
  // Auto-grading Results
  autoGrading: {
    isAutoGraded: boolean;
    gradingTime: Date;
    confidence: number; // AI confidence in grading (0-100)
    needsReview: boolean;
    reviewReason?: string;
    gradingVersion: string;
  };
  
  // Feedback and Recommendations
  feedback: {
    overallFeedback: string;
    improvementSuggestions: string[];
    recommendedStudyMaterials: Array<{
      materialId: Types.ObjectId;
      title: string;
      reason: string;
    }>;
    nextSteps: string[];
    motivationalMessage: string;
  };
  
  // Review and Analysis
  review: {
    isReviewed: boolean;
    reviewedAt?: Date;
    reviewedBy?: {
      userId: Types.ObjectId;
      name: string;
      role: string;
    };
    manualScore?: number;
    reviewNotes?: string;
    disputes: Array<{
      questionId: Types.ObjectId;
      reason: string;
      status: 'pending' | 'resolved' | 'rejected';
      resolution?: string;
    }>;
  };
  
  // Metadata
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptEnhancedSchema = new Schema<IAttemptEnhanced>({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'TestEnhanced',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Attempt Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'submitted', 'expired', 'abandoned'],
    default: 'in_progress',
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  timeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  ipAddress: String,
  userAgent: String,
  
  // Question Responses
  responses: [{
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionEnhanced',
      required: true
    },
    selectedAnswers: [{
      type: String,
      trim: true
    }],
    textAnswer: {
      type: String,
      maxlength: 2000
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    maxPoints: {
      type: Number,
      required: true,
      min: 0
    },
    isSkipped: {
      type: Boolean,
      default: false
    },
    flagged: {
      type: Boolean,
      default: false
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1
    },
    explanation: String,
    hint: String,
    reviewNote: {
      type: String,
      maxlength: 500
    }
  }],
  
  // Scoring Details
  score: {
    totalPoints: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    grade: { 
      type: String, 
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'], 
      default: 'F' 
    },
    isPassed: { type: Boolean, default: false },
    breakdown: {
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      flagged: { type: Number, default: 0 }
    },
    difficultyBreakdown: {
      beginner: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      intermediate: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      advanced: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      }
    },
    topicBreakdown: [{
      topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
      topicName: { type: String, required: true },
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }]
  },
  
  // Performance Analytics
  performance: {
    averageTimePerQuestion: { type: Number, default: 0 },
    fastestQuestion: {
      questionId: { type: Schema.Types.ObjectId, ref: 'QuestionEnhanced' },
      time: { type: Number, default: 0 }
    },
    slowestQuestion: {
      questionId: { type: Schema.Types.ObjectId, ref: 'QuestionEnhanced' },
      time: { type: Number, default: 0 }
    },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
    improvementAreas: [String],
    strengths: [String]
  },
  
  // Auto-grading Results
  autoGrading: {
    isAutoGraded: { type: Boolean, default: false },
    gradingTime: Date,
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    needsReview: { type: Boolean, default: false },
    reviewReason: String,
    gradingVersion: { type: String, default: '1.0' }
  },
  
  // Feedback and Recommendations
  feedback: {
    overallFeedback: { type: String, default: '' },
    improvementSuggestions: [String],
    recommendedStudyMaterials: [{
      materialId: { type: Schema.Types.ObjectId, ref: 'MaterialEnhanced' },
      title: { type: String, required: true },
      reason: { type: String, required: true }
    }],
    nextSteps: [String],
    motivationalMessage: { type: String, default: '' }
  },
  
  // Review and Analysis
  review: {
    isReviewed: { type: Boolean, default: false },
    reviewedAt: Date,
    reviewedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: String
    },
    manualScore: { type: Number, min: 0, max: 100 },
    reviewNotes: String,
    disputes: [{
      questionId: { type: Schema.Types.ObjectId, ref: 'QuestionEnhanced' },
      reason: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['pending', 'resolved', 'rejected'],
        default: 'pending'
      },
      resolution: String
    }]
  },
  
  submittedAt: Date
}, {
  timestamps: true,
  collection: 'attemptsEnhanced'
});

// Compound indexes
AttemptEnhancedSchema.index({ testId: 1, userId: 1, attemptNumber: 1 }, { unique: true });
AttemptEnhancedSchema.index({ userId: 1, status: 1, createdAt: -1 });
AttemptEnhancedSchema.index({ testId: 1, status: 1, 'score.percentage': -1 });
AttemptEnhancedSchema.index({ 'autoGrading.needsReview': 1, 'review.isReviewed': 1 });

// Pre-save middleware
AttemptEnhancedSchema.pre('save', function(this: IAttemptEnhanced, next) {
  // Calculate time spent if end time is set
  if (this.endTime && this.startTime) {
    this.timeSpent = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  
  // Calculate performance metrics
  if (this.responses && this.responses.length > 0) {
    this.performance.averageTimePerQuestion = 
      this.responses.reduce((sum, r) => sum + r.timeSpent, 0) / this.responses.length;
    
    // Find fastest and slowest questions
    const sortedByTime = [...this.responses].sort((a, b) => a.timeSpent - b.timeSpent);
    this.performance.fastestQuestion = {
      questionId: sortedByTime[0].questionId,
      time: sortedByTime[0].timeSpent
    };
    this.performance.slowestQuestion = {
      questionId: sortedByTime[sortedByTime.length - 1].questionId,
      time: sortedByTime[sortedByTime.length - 1].timeSpent
    };
    
    // Calculate accuracy
    const correctAnswers = this.responses.filter(r => r.isCorrect).length;
    this.performance.accuracy = (correctAnswers / this.responses.length) * 100;
  }
  
  next();
});

// Instance methods
AttemptEnhancedSchema.methods.calculateGrade = function(this: IAttemptEnhanced) {
  const percentage = this.score.percentage;
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

AttemptEnhancedSchema.methods.generateFeedback = function(this: IAttemptEnhanced) {
  const score = this.score.percentage;
  let overallFeedback = '';
  let motivationalMessage = '';
  
  if (score >= 90) {
    overallFeedback = 'Excellent performance! You have demonstrated a strong understanding of the material.';
    motivationalMessage = 'Keep up the outstanding work! Your dedication is paying off.';
  } else if (score >= 80) {
    overallFeedback = 'Good job! You have a solid grasp of most concepts.';
    motivationalMessage = 'You\'re doing well! A little more practice will help you excel.';
  } else if (score >= 70) {
    overallFeedback = 'Fair performance. There are areas that need improvement.';
    motivationalMessage = 'Don\'t give up! With focused study, you can improve significantly.';
  } else {
    overallFeedback = 'This attempt shows you need more preparation. Consider reviewing the fundamentals.';
    motivationalMessage = 'Every expert was once a beginner. Keep practicing and you will improve!';
  }
  
  this.feedback.overallFeedback = overallFeedback;
  this.feedback.motivationalMessage = motivationalMessage;
};

// Static methods
AttemptEnhancedSchema.statics.getStudentProgress = function(userId: string, testId?: string) {
  const match: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (testId) match.testId = new mongoose.Types.ObjectId(testId);
  
  return this.aggregate([
    { $match: match },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: '$testId',
        attempts: {
          $push: {
            attemptNumber: '$attemptNumber',
            score: '$score.percentage',
            createdAt: '$createdAt'
          }
        },
        bestScore: { $max: '$score.percentage' },
        lastAttempt: { $last: '$$ROOT' }
      }
    }
  ]);
};

AttemptEnhancedSchema.statics.getTestAnalytics = function(testId: string) {
  return this.aggregate([
    { $match: { testId: new mongoose.Types.ObjectId(testId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        passRate: {
          $avg: { $cond: ['$score.isPassed', 1, 0] }
        },
        averageTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);
};

export default mongoose.models.AttemptEnhanced || mongoose.model<IAttemptEnhanced>('AttemptEnhanced', AttemptEnhancedSchema);