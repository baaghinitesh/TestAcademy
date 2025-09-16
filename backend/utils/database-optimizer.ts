import mongoose from 'mongoose';
import QuestionEnhancedV2 from '../models/QuestionEnhancedV2';
import TestEnhanced from '../models/TestEnhanced';
import AttemptEnhanced from '../models/AttemptEnhanced';
import MaterialEnhanced from '../models/MaterialEnhanced';

export class DatabaseOptimizer {
  
  /**
   * Create optimized indexes for enhanced models
   */
  static async createOptimizedIndexes() {
    try {
      console.log('Creating optimized database indexes...');
      
      // Question Enhanced Indexes
      await QuestionEnhancedV2.collection.createIndex({ 
        classId: 1, 
        subjectId: 1, 
        chapterId: 1, 
        topicId: 1 
      });
      
      await QuestionEnhancedV2.collection.createIndex({ 
        type: 1, 
        difficulty: 1, 
        isActive: 1, 
        'verification.status': 1 
      });
      
      await QuestionEnhancedV2.collection.createIndex({ 
        'bulkUpload.batchId': 1 
      });
      
      await QuestionEnhancedV2.collection.createIndex({ 
        'analytics.usageCount': -1, 
        'analytics.averageScore': -1 
      });
      
      // Text search index for questions
      await QuestionEnhancedV2.collection.createIndex({ 
        question: 'text', 
        'options': 'text', 
        explanation: 'text',
        hint: 'text'
      });
      
      // Test Enhanced Indexes  
      await TestEnhanced.collection.createIndex({ 
        classId: 1, 
        subjectId: 1, 
        isActive: 1, 
        startDate: 1, 
        endDate: 1 
      });
      
      await TestEnhanced.collection.createIndex({ 
        'createdBy.userId': 1, 
        createdAt: -1 
      });
      
      await TestEnhanced.collection.createIndex({ 
        testType: 1, 
        difficulty: 1, 
        'analytics.totalAttempts': -1 
      });
      
      // Attempt Enhanced Indexes
      await AttemptEnhanced.collection.createIndex({ 
        testId: 1, 
        userId: 1, 
        attemptNumber: 1 
      }, { unique: true });
      
      await AttemptEnhanced.collection.createIndex({ 
        userId: 1, 
        status: 1, 
        createdAt: -1 
      });
      
      await AttemptEnhanced.collection.createIndex({ 
        testId: 1, 
        status: 1, 
        'score.percentage': -1 
      });
      
      await AttemptEnhanced.collection.createIndex({ 
        'autoGrading.needsReview': 1, 
        'review.isReviewed': 1 
      });
      
      // Material Enhanced Indexes
      await MaterialEnhanced.collection.createIndex({ 
        classId: 1, 
        subjectId: 1, 
        contentType: 1, 
        isActive: 1 
      });
      
      await MaterialEnhanced.collection.createIndex({ 
        'workflow.status': 1, 
        'createdBy.userId': 1 
      });
      
      await MaterialEnhanced.collection.createIndex({ 
        'analytics.viewCount': -1, 
        'analytics.averageRating': -1 
      });
      
      // Text search for materials
      await MaterialEnhanced.collection.createIndex({ 
        title: 'text', 
        description: 'text',
        textContent: 'text',
        'files.extractedText': 'text'
      });
      
      console.log('Database indexes created successfully');
      
    } catch (error) {
      console.error('Error creating database indexes:', error);
      throw error;
    }
  }
  
  /**
   * Analyze query performance and suggest optimizations
   */
  static async analyzeQueryPerformance() {
    try {
      console.log('Analyzing query performance...');
      
      const db = mongoose.connection.db;
      
      // Get collection stats
      const collections = ['questionenhancedv2s', 'testenhanceds', 'attemptenhanceds', 'materialenhanceds'];
      const stats = {};
      
      for (const collectionName of collections) {
        try {
          const collStats = await db.collection(collectionName).stats();
          stats[collectionName] = {
            count: collStats.count,
            avgObjSize: Math.round(collStats.avgObjSize),
            storageSize: Math.round(collStats.storageSize / 1024 / 1024), // MB
            totalIndexSize: Math.round(collStats.totalIndexSize / 1024 / 1024), // MB
            indexCount: collStats.nindexes
          };
        } catch (error) {
          console.warn(`Collection ${collectionName} not found, skipping stats`);
        }
      }
      
      // Check slow queries (if profiling is enabled)
      try {
        const slowQueries = await db.collection('system.profile')
          .find({ ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
          .sort({ millis: -1 })
          .limit(10)
          .toArray();
          
        if (slowQueries.length > 0) {
          console.log('Top slow queries in last 24 hours:');
          slowQueries.forEach((query, index) => {
            console.log(`${index + 1}. Duration: ${query.millis}ms, Command: ${JSON.stringify(query.command)}`);
          });
        }
      } catch (error) {
        console.log('Query profiling not enabled or accessible');
      }
      
      return {
        collectionStats: stats,
        recommendations: this.generateOptimizationRecommendations(stats)
      };
      
    } catch (error) {
      console.error('Error analyzing query performance:', error);
      throw error;
    }
  }
  
  /**
   * Generate optimization recommendations based on collection stats
   */
  private static generateOptimizationRecommendations(stats: any) {
    const recommendations = [];
    
    Object.entries(stats).forEach(([collection, collStats]: [string, any]) => {
      // Check if collection is large enough to benefit from optimization
      if (collStats.count > 10000) {
        recommendations.push({
          collection,
          type: 'scaling',
          message: `Collection ${collection} has ${collStats.count} documents. Consider implementing pagination and query limits.`
        });
      }
      
      // Check index to data ratio
      const indexRatio = collStats.totalIndexSize / collStats.storageSize;
      if (indexRatio > 0.5) {
        recommendations.push({
          collection,
          type: 'indexing',
          message: `Collection ${collection} has high index overhead (${Math.round(indexRatio * 100)}%). Review unused indexes.`
        });
      }
      
      // Check average document size
      if (collStats.avgObjSize > 16384) { // 16KB
        recommendations.push({
          collection,
          type: 'document_size',
          message: `Collection ${collection} has large average document size (${Math.round(collStats.avgObjSize / 1024)}KB). Consider document structure optimization.`
        });
      }
    });
    
    return recommendations;
  }
  
  /**
   * Optimize aggregation pipelines for better performance
   */
  static getOptimizedAggregationPipelines() {
    return {
      // Optimized question search with pagination
      questionSearch: (filters: any, page: number = 1, limit: number = 20) => [
        // Match stage - place restrictive filters first
        { 
          $match: { 
            isActive: true,
            ...filters 
          } 
        },
        
        // Early filtering for performance
        ...(filters.searchText ? [
          {
            $match: {
              $text: { $search: filters.searchText }
            }
          }
        ] : []),
        
        // Add computed fields only if needed
        {
          $addFields: {
            score: filters.searchText ? { $meta: 'textScore' } : 1
          }
        },
        
        // Sort efficiently
        { 
          $sort: filters.searchText 
            ? { score: { $meta: 'textScore' }, createdAt: -1 }
            : { createdAt: -1 }
        },
        
        // Pagination
        { $skip: (page - 1) * limit },
        { $limit: limit },
        
        // Populate only required fields
        {
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'class',
            pipeline: [{ $project: { name: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'subjects', 
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject',
            pipeline: [{ $project: { name: 1 } }]
          }
        },
        
        // Final projection to reduce data transfer
        {
          $project: {
            question: 1,
            type: 1,
            difficulty: 1,
            options: 1,
            correctAnswers: 1,
            'analytics.usageCount': 1,
            'analytics.averageScore': 1,
            'verification.status': 1,
            createdAt: 1,
            class: { $arrayElemAt: ['$class', 0] },
            subject: { $arrayElemAt: ['$subject', 0] }
          }
        }
      ],
      
      // Optimized test analytics
      testAnalytics: (testId: string) => [
        { $match: { testId: new mongoose.Types.ObjectId(testId), status: 'completed' } },
        
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            averageScore: { $avg: '$score.percentage' },
            passRate: { 
              $avg: { $cond: ['$score.isPassed', 1, 0] } 
            },
            averageTimeSpent: { $avg: '$timeSpent' },
            scoreDistribution: {
              $push: {
                $switch: {
                  branches: [
                    { case: { $gte: ['$score.percentage', 90] }, then: 'A' },
                    { case: { $gte: ['$score.percentage', 80] }, then: 'B' },
                    { case: { $gte: ['$score.percentage', 70] }, then: 'C' },
                    { case: { $gte: ['$score.percentage', 60] }, then: 'D' }
                  ],
                  default: 'F'
                }
              }
            }
          }
        },
        
        {
          $addFields: {
            gradeDistribution: {
              A: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'A'] } } } },
              B: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'B'] } } } },
              C: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'C'] } } } },
              D: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'D'] } } } },
              F: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'F'] } } } }
            }
          }
        },
        
        { $unset: 'scoreDistribution' }
      ],
      
      // Optimized student progress tracking
      studentProgress: (userId: string) => [
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        
        {
          $group: {
            _id: '$testId',
            attempts: {
              $push: {
                attemptNumber: '$attemptNumber',
                score: '$score.percentage',
                createdAt: '$createdAt',
                timeSpent: '$timeSpent'
              }
            },
            bestScore: { $max: '$score.percentage' },
            lastAttempt: { $last: '$$ROOT' },
            averageScore: { $avg: '$score.percentage' },
            totalTimeSpent: { $sum: '$timeSpent' }
          }
        },
        
        {
          $lookup: {
            from: 'testsEnhanced',
            localField: '_id',
            foreignField: '_id',
            as: 'test',
            pipeline: [
              { 
                $project: { 
                  title: 1, 
                  passingScore: 1,
                  difficulty: 1,
                  totalQuestions: 1
                } 
              }
            ]
          }
        },
        
        {
          $addFields: {
            test: { $arrayElemAt: ['$test', 0] },
            isPassed: { $gte: ['$bestScore', { $ifNull: [{ $arrayElemAt: ['$test.passingScore', 0] }, 60] }] },
            improvement: {
              $cond: {
                if: { $gt: [{ $size: '$attempts' }, 1] },
                then: {
                  $subtract: [
                    { $arrayElemAt: ['$attempts.score', -1] },
                    { $arrayElemAt: ['$attempts.score', 0] }
                  ]
                },
                else: 0
              }
            }
          }
        },
        
        { $sort: { 'lastAttempt.createdAt': -1 } }
      ]
    };
  }
  
  /**
   * Setup database connection pooling and optimization
   */
  static setupConnectionOptimization() {
    // Configure mongoose for better performance
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);
    
    // Connection pool settings
    const optimizedOptions = {
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2,  // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };
    
    return optimizedOptions;
  }
  
  /**
   * Implement database cleanup and maintenance
   */
  static async performMaintenance() {
    try {
      console.log('Starting database maintenance...');
      
      // Clean up expired sessions
      const expirationDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      // Archive old attempts (older than 1 year)
      const archiveDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const oldAttemptsCount = await AttemptEnhanced.countDocuments({ 
        createdAt: { $lt: archiveDate } 
      });
      
      if (oldAttemptsCount > 0) {
        console.log(`Found ${oldAttemptsCount} old attempts to archive`);
        // In production, you might move these to a different collection or cold storage
      }
      
      // Clean up incomplete attempts older than 24 hours
      const incompleteDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const deletedIncomplete = await AttemptEnhanced.deleteMany({
        status: 'in_progress',
        createdAt: { $lt: incompleteDate }
      });
      
      console.log(`Cleaned up ${deletedIncomplete.deletedCount} incomplete attempts`);
      
      // Update collection statistics
      const db = mongoose.connection.db;
      const collections = ['questionsEnhanced', 'testsEnhanced', 'attemptsEnhanced', 'materialsEnhanced'];
      
      for (const collectionName of collections) {
        try {
          await db.collection(collectionName).reIndex();
          console.log(`Reindexed collection: ${collectionName}`);
        } catch (error) {
          console.warn(`Failed to reindex ${collectionName}:`, error);
        }
      }
      
      console.log('Database maintenance completed');
      
    } catch (error) {
      console.error('Database maintenance failed:', error);
      throw error;
    }
  }
}

export default DatabaseOptimizer;