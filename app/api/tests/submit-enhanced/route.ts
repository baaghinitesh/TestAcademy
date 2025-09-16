import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/backend/config/db';
import TestEnhanced from '@/backend/models/TestEnhanced';
import AttemptEnhanced from '@/backend/models/AttemptEnhanced';
import QuestionEnhancedV2 from '@/backend/models/QuestionEnhancedV2';

interface SubmissionData {
  testId: string;
  userId: string;
  responses: Array<{
    questionId: string;
    selectedAnswers: string[];
    textAnswer?: string;
    timeSpent: number;
    isSkipped: boolean;
    flagged: boolean;
    visitCount: number;
    reviewNote?: string;
  }>;
  totalTimeSpent: number;
  submitType: 'auto' | 'manual'; // auto = time expired, manual = user clicked submit
  ipAddress?: string;
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const submissionData: SubmissionData = await request.json();
    const { testId, userId, responses, totalTimeSpent, submitType, ipAddress, userAgent } = submissionData;
    
    // Validate required fields
    if (!testId || !userId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { success: false, message: 'Invalid submission data' },
        { status: 400 }
      );
    }
    
    // Get test details
    const test = await TestEnhanced.findById(testId).populate('questions.questionId');
    if (!test) {
      return NextResponse.json(
        { success: false, message: 'Test not found' },
        { status: 404 }
      );
    }
    
    // Check if test is available
    if (!test.isAvailable()) {
      return NextResponse.json(
        { success: false, message: 'Test is not currently available' },
        { status: 403 }
      );
    }
    
    // Check existing attempts
    const existingAttempts = await AttemptEnhanced.find({ testId, userId }).sort({ attemptNumber: -1 });
    const attemptNumber = existingAttempts.length + 1;
    
    // Check if user has exceeded max attempts
    if (attemptNumber > test.maxAttempts) {
      return NextResponse.json(
        { success: false, message: 'Maximum attempts exceeded' },
        { status: 403 }
      );
    }
    
    // Check for existing in-progress attempt
    const inProgressAttempt = existingAttempts.find(attempt => attempt.status === 'in_progress');
    let attempt;
    
    if (inProgressAttempt) {
      // Update existing attempt
      attempt = inProgressAttempt;
      attempt.endTime = new Date();
      attempt.timeSpent = totalTimeSpent;
      attempt.status = 'submitted';
      attempt.submittedAt = new Date();
      if (ipAddress) attempt.ipAddress = ipAddress;
      if (userAgent) attempt.userAgent = userAgent;
    } else {
      // Create new attempt
      const startTime = new Date(Date.now() - (totalTimeSpent * 1000)); // Calculate start time
      
      attempt = new AttemptEnhanced({
        testId,
        userId,
        attemptNumber,
        status: 'submitted',
        startTime,
        endTime: new Date(),
        timeSpent: totalTimeSpent,
        submittedAt: new Date(),
        ipAddress,
        userAgent,
        responses: [],
        score: {
          totalPoints: 0,
          maxPoints: 0,
          percentage: 0,
          grade: 'F',
          isPassed: false,
          breakdown: {
            correct: 0,
            incorrect: 0,
            skipped: 0,
            flagged: 0
          },
          difficultyBreakdown: {
            beginner: { correct: 0, total: 0, percentage: 0 },
            intermediate: { correct: 0, total: 0, percentage: 0 },
            advanced: { correct: 0, total: 0, percentage: 0 }
          },
          topicBreakdown: []
        },
        performance: {
          averageTimePerQuestion: 0,
          fastestQuestion: { questionId: '', time: 0 },
          slowestQuestion: { questionId: '', time: 0 },
          accuracy: 0,
          consistencyScore: 0,
          improvementAreas: [],
          strengths: []
        },
        autoGrading: {
          isAutoGraded: false,
          confidence: 0,
          needsReview: false,
          gradingVersion: '1.0'
        },
        feedback: {
          overallFeedback: '',
          improvementSuggestions: [],
          recommendedStudyMaterials: [],
          nextSteps: [],
          motivationalMessage: ''
        },
        review: {
          isReviewed: false,
          disputes: []
        }
      });
    }
    
    // Process responses
    const processedResponses = [];
    const questionMap = new Map();
    
    // Create question lookup map
    test.questions.forEach(tq => {
      questionMap.set(tq.questionId._id.toString(), {
        question: tq.questionId,
        points: tq.points,
        order: tq.order
      });
    });
    
    // Calculate difficulty and topic breakdowns
    const difficultyStats = {
      beginner: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      advanced: { correct: 0, total: 0 }
    };
    
    const topicStats = new Map();
    
    for (const response of responses) {
      const questionData = questionMap.get(response.questionId);
      if (!questionData) continue;
      
      const question = questionData.question;
      const maxPoints = questionData.points;
      
      // Initialize response object
      const processedResponse = {
        questionId: response.questionId,
        selectedAnswers: response.selectedAnswers || [],
        textAnswer: response.textAnswer || '',
        timeSpent: response.timeSpent || 0,
        isCorrect: false,
        pointsEarned: 0,
        maxPoints,
        isSkipped: response.isSkipped || false,
        flagged: response.flagged || false,
        visitCount: response.visitCount || 1,
        reviewNote: response.reviewNote || ''
      };
      
      // Skip auto-grading for now - will be done separately
      // This allows for immediate submission response while grading runs in background
      
      // Update difficulty stats
      const difficulty = question.difficulty || 'intermediate';
      if (difficultyStats[difficulty as keyof typeof difficultyStats]) {
        difficultyStats[difficulty as keyof typeof difficultyStats].total++;
      }
      
      // Update topic stats
      const topic = question.topic || question.chapter || 'General';
      if (!topicStats.has(topic)) {
        topicStats.set(topic, { name: topic, correct: 0, total: 0 });
      }
      topicStats.get(topic).total++;
      
      processedResponses.push(processedResponse);
    }
    
    // Update attempt with responses
    attempt.responses = processedResponses;
    
    // Calculate basic breakdown
    attempt.score.breakdown = {
      correct: 0, // Will be updated after grading
      incorrect: 0, // Will be updated after grading
      skipped: processedResponses.filter(r => r.isSkipped).length,
      flagged: processedResponses.filter(r => r.flagged).length
    };
    
    // Set difficulty breakdown structure
    attempt.score.difficultyBreakdown = {
      beginner: { 
        correct: 0, 
        total: difficultyStats.beginner.total, 
        percentage: 0 
      },
      intermediate: { 
        correct: 0, 
        total: difficultyStats.intermediate.total, 
        percentage: 0 
      },
      advanced: { 
        correct: 0, 
        total: difficultyStats.advanced.total, 
        percentage: 0 
      }
    };
    
    // Set topic breakdown structure
    attempt.score.topicBreakdown = Array.from(topicStats.values()).map(topic => ({
      topicId: '', // Would need to be populated from actual topic IDs
      topicName: topic.name,
      correct: 0,
      total: topic.total,
      percentage: 0
    }));
    
    // Save attempt
    await attempt.save();
    
    // Trigger auto-grading in the background
    // Note: In production, this should be done via a queue system
    try {
      const gradingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tests/auto-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt._id })
      });
      
      if (gradingResponse.ok) {
        console.log('Auto-grading initiated successfully');
      }
    } catch (error) {
      console.error('Failed to initiate auto-grading:', error);
    }
    
    // Update test analytics
    await updateTestAnalytics(testId);
    
    // Return immediate response
    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attemptId: attempt._id,
        attemptNumber: attempt.attemptNumber,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        isGrading: true,
        estimatedGradingTime: Math.ceil(responses.length / 10) // Rough estimate in seconds
      }
    });
    
  } catch (error: any) {
    console.error('Test submission error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Submission failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check submission status and get results
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const attemptId = url.searchParams.get('attemptId');
    
    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: 'Attempt ID is required' },
        { status: 400 }
      );
    }
    
    const attempt = await AttemptEnhanced.findById(attemptId)
      .populate('testId')
      .populate('responses.questionId');
    
    if (!attempt) {
      return NextResponse.json(
        { success: false, message: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    const isGrading = !attempt.autoGrading.isAutoGraded;
    
    return NextResponse.json({
      success: true,
      data: {
        attempt,
        isGrading,
        gradingComplete: attempt.autoGrading.isAutoGraded,
        needsReview: attempt.autoGrading.needsReview
      }
    });
    
  } catch (error: any) {
    console.error('Get attempt error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get attempt' },
      { status: 500 }
    );
  }
}

// Helper function to update test analytics
async function updateTestAnalytics(testId: string) {
  try {
    const analytics = await AttemptEnhanced.aggregate([
      { $match: { testId: testId, status: { $in: ['completed', 'submitted'] } } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$score.percentage' },
          passRate: { $avg: { $cond: ['$score.isPassed', 1, 0] } },
          averageTimeSpent: { $avg: '$timeSpent' }
        }
      }
    ]);
    
    if (analytics.length > 0) {
      const stats = analytics[0];
      
      await TestEnhanced.findByIdAndUpdate(testId, {
        'analytics.totalAttempts': stats.totalAttempts,
        'analytics.averageScore': stats.averageScore,
        'analytics.passRate': stats.passRate,
        'analytics.averageTimeSpent': stats.averageTimeSpent
      });
    }
  } catch (error) {
    console.error('Failed to update test analytics:', error);
  }
}

// PUT endpoint for manual score adjustment
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const { attemptId, adjustments, reviewedBy } = await request.json();
    
    if (!attemptId || !adjustments) {
      return NextResponse.json(
        { success: false, message: 'Attempt ID and adjustments are required' },
        { status: 400 }
      );
    }
    
    const attempt = await AttemptEnhanced.findById(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { success: false, message: 'Attempt not found' },
        { status: 404 }
      );
    }
    
    // Apply manual adjustments
    for (const adjustment of adjustments) {
      const responseIndex = attempt.responses.findIndex(
        r => r.questionId.toString() === adjustment.questionId
      );
      
      if (responseIndex !== -1) {
        attempt.responses[responseIndex].pointsEarned = adjustment.pointsEarned;
        attempt.responses[responseIndex].isCorrect = adjustment.pointsEarned > 0;
      }
    }
    
    // Recalculate totals
    const totalPointsEarned = attempt.responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    const maxPoints = attempt.responses.reduce((sum, r) => sum + r.maxPoints, 0);
    const percentage = maxPoints > 0 ? (totalPointsEarned / maxPoints) * 100 : 0;
    
    attempt.score.totalPoints = totalPointsEarned;
    attempt.score.percentage = percentage;
    attempt.score.grade = attempt.calculateGrade();
    
    const test = await TestEnhanced.findById(attempt.testId);
    attempt.score.isPassed = percentage >= (test?.passingScore || 60);
    
    // Mark as manually reviewed
    attempt.review.isReviewed = true;
    attempt.review.reviewedAt = new Date();
    if (reviewedBy) {
      attempt.review.reviewedBy = reviewedBy;
    }
    
    await attempt.save();
    
    // Update test analytics
    await updateTestAnalytics(attempt.testId.toString());
    
    return NextResponse.json({
      success: true,
      message: 'Attempt updated successfully',
      data: {
        score: attempt.score,
        review: attempt.review
      }
    });
    
  } catch (error: any) {
    console.error('Manual adjustment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update attempt' },
      { status: 500 }
    );
  }
}