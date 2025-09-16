import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { User, Test, Question, Attempt, Material, Subject } from '../../../backend/models';
import { requireAdmin } from '../../../backend/middleware/auth';

// GET /api/analytics - Get comprehensive analytics data
async function getAnalyticsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || '30days';
    const subjectFilter = searchParams.get('subject') || 'all';
    const classFilter = searchParams.get('class') || 'all';

    await connectToDatabase();

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Build filters
    const dateFilter = { createdAt: { $gte: startDate } };
    const subjectFilterObj = subjectFilter !== 'all' ? { subject: subjectFilter } : {};
    const classFilterObj = classFilter !== 'all' ? { classNumber: parseInt(classFilter) } : {};

    // Overview Statistics
    const [totalStudents, totalTests, totalQuestions, totalMaterials] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Test.countDocuments(dateFilter),
      Question.countDocuments({ ...dateFilter, ...subjectFilterObj, ...classFilterObj }),
      Material.countDocuments({ ...dateFilter, ...subjectFilterObj, ...classFilterObj })
    ]);

    // Test attempts with date filter
    const totalAttempts = await Attempt.countDocuments({
      ...dateFilter,
      status: 'completed'
    });

    // Average score calculation
    const avgScoreResult = await Attempt.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: 'completed' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          averageScore: { $avg: '$percentage' } 
        } 
      }
    ]);
    
    const averageScore = avgScoreResult.length > 0 ? avgScoreResult[0].averageScore : 0;

    // Test Performance Analytics
    const testPerformance = await Attempt.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: 'completed' 
        } 
      },
      {
        $group: {
          _id: '$test',
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: '_id',
          as: 'testInfo'
        }
      },
      {
        $unwind: '$testInfo'
      },
      {
        $project: {
          testId: '$_id',
          testTitle: '$testInfo.title',
          totalAttempts: 1,
          averageScore: { $round: ['$averageScore', 1] },
          highestScore: { $round: ['$highestScore', 1] },
          lowestScore: { $round: ['$lowestScore', 1] },
          completionRate: {
            $multiply: [
              { $divide: ['$totalAttempts', '$testInfo.totalQuestions'] },
              100
            ]
          }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 20 }
    ]);

    // Student Performance Analytics
    const studentPerformance = await Attempt.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: 'completed' 
        } 
      },
      {
        $group: {
          _id: '$student',
          testsAttempted: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalTimeTaken: { $sum: '$totalTimeTaken' },
          scores: { $push: '$percentage' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $project: {
          studentId: '$_id',
          studentName: '$studentInfo.name',
          testsAttempted: 1,
          averageScore: { $round: ['$averageScore', 1] },
          totalTimeTaken: 1,
          improvementTrend: {
            $cond: {
              if: { $gte: [{ $size: '$scores' }, 2] },
              then: {
                $cond: {
                  if: { 
                    $gt: [
                      { $arrayElemAt: ['$scores', -1] },
                      { $arrayElemAt: ['$scores', 0] }
                    ]
                  },
                  then: 'up',
                  else: {
                    $cond: {
                      if: {
                        $lt: [
                          { $arrayElemAt: ['$scores', -1] },
                          { $arrayElemAt: ['$scores', 0] }
                        ]
                      },
                      then: 'down',
                      else: 'stable'
                    }
                  }
                }
              },
              else: 'stable'
            }
          }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 20 }
    ]);

    // Subject-wise Performance Analytics
    const subjectWisePerformance = await Question.aggregate([
      {
        $match: {
          ...dateFilter,
          ...classFilterObj
        }
      },
      {
        $lookup: {
          from: 'testattempts',
          localField: '_id',
          foreignField: 'answers.questionId',
          as: 'attempts'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      {
        $unwind: '$subjectInfo'
      },
      {
        $group: {
          _id: '$subject',
          subjectName: { $first: '$subjectInfo.name' },
          totalAttempts: { $sum: { $size: '$attempts' } },
          easyQuestions: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] }
          },
          mediumQuestions: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] }
          },
          hardQuestions: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] }
          },
          averageScore: { $avg: 75 } // Placeholder - would need more complex aggregation
        }
      },
      {
        $project: {
          subjectId: '$_id',
          subjectName: 1,
          averageScore: { $round: ['$averageScore', 1] },
          totalAttempts: 1,
          difficultyDistribution: {
            easy: '$easyQuestions',
            medium: '$mediumQuestions',
            hard: '$hardQuestions'
          }
        }
      }
    ]);

    // Time-based Analytics (last 30 days)
    const timeBasedAnalytics = await Attempt.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalTimeSpent: { $sum: '$totalTimeTaken' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalAttempts: 1,
          averageScore: { $round: ['$averageScore', 1] },
          totalTimeSpent: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Question Analytics
    const questionAnalytics = await Question.aggregate([
      {
        $match: {
          ...dateFilter,
          ...subjectFilterObj,
          ...classFilterObj
        }
      },
      {
        $lookup: {
          from: 'testattempts',
          let: { questionId: '$_id' },
          pipeline: [
            { $unwind: '$answers' },
            { $match: { $expr: { $eq: ['$answers.questionId', '$$questionId'] } } },
            {
              $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                correctAttempts: {
                  $sum: { $cond: ['$answers.isCorrect', 1, 0] }
                },
                totalTime: { $sum: '$answers.timeTaken' }
              }
            }
          ],
          as: 'stats'
        }
      },
      {
        $project: {
          questionText: { $substr: ['$question', 0, 100] },
          difficulty: 1,
          correctRate: {
            $cond: {
              if: { $gt: [{ $size: '$stats' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $arrayElemAt: ['$stats.correctAttempts', 0] },
                      { $arrayElemAt: ['$stats.totalAttempts', 0] }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          },
          averageTime: {
            $cond: {
              if: { $gt: [{ $size: '$stats' }, 0] },
              then: {
                $divide: [
                  { $arrayElemAt: ['$stats.totalTime', 0] },
                  { $arrayElemAt: ['$stats.totalAttempts', 0] }
                ]
              },
              else: 0
            }
          },
          totalAttempts: {
            $cond: {
              if: { $gt: [{ $size: '$stats' }, 0] },
              then: { $arrayElemAt: ['$stats.totalAttempts', 0] },
              else: 0
            }
          }
        }
      },
      { $sort: { correctRate: 1 } }, // Show most difficult questions first
      { $limit: 50 }
    ]);

    const analyticsData = {
      overview: {
        totalStudents,
        totalTests,
        totalQuestions,
        totalMaterials,
        averageScore: Math.round(averageScore * 10) / 10,
        totalAttempts
      },
      testPerformance,
      studentPerformance,
      subjectWisePerformance,
      timeBasedAnalytics,
      questionAnalytics: questionAnalytics.map(q => ({
        questionId: q._id,
        questionText: q.questionText + '...',
        correctRate: Math.round(q.correctRate * 10) / 10,
        averageTime: Math.round(q.averageTime),
        difficulty: q.difficulty,
        totalAttempts: q.totalAttempts
      }))
    };

    return NextResponse.json(analyticsData, { status: 200 });

  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(getAnalyticsHandler);