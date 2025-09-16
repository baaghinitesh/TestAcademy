import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../../backend/utils/database';
import { Test, Question, Attempt } from '../../../../../backend/models';
import AutoGradingService, { SubmittedAnswer } from '../../../../../lib/services/auto-grading';
import { requireAuth } from '../../../../../backend/middleware/auth';

// POST /api/tests/[id]/submit - Submit test for automatic grading
async function submitTestHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: testId } = params;
    const body = await request.json();
    const { answers, attemptId, studentId, startTime } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Answers array is required' },
        { status: 400 }
      );
    }

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Validate test exists
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Validate attempt exists and belongs to the student
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.student.toString() !== studentId) {
      return NextResponse.json(
        { error: 'Unauthorized - attempt does not belong to student' },
        { status: 403 }
      );
    }

    if (attempt.status === 'completed' || attempt.status === 'submitted') {
      return NextResponse.json(
        { error: 'Test has already been submitted' },
        { status: 400 }
      );
    }

    // Validate answers format
    const validationErrors: string[] = [];
    const submittedAnswers: SubmittedAnswer[] = [];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const validation = AutoGradingService.validateAnswer(answer);
      
      if (!validation.isValid) {
        validationErrors.push(`Answer ${i + 1}: ${validation.error}`);
      } else {
        submittedAnswers.push(answer);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid answer format',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Get questions for grading
    const questions = await Question.find({ 
      test: testId, 
      isActive: true 
    }).sort({ order: 1 });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this test' },
        { status: 400 }
      );
    }

    // Perform automatic grading
    const gradingResult = await AutoGradingService.gradeTestAttempt(questions, submittedAnswers);

    // Calculate submission time
    const completedAt = new Date();
    const totalTimeTaken = startTime ? Math.floor((completedAt.getTime() - new Date(startTime).getTime()) / 1000) : gradingResult.totalTimeTaken;

    // Update attempt with results
    const updatedAttempt = await Attempt.findByIdAndUpdate(
      attemptId,
      {
        answers: gradingResult.answers.map(answer => ({
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          isCorrect: answer.isCorrect,
          marksEarned: answer.marksEarned,
          timeTaken: answer.timeTaken
        })),
        score: gradingResult.percentage,
        percentage: gradingResult.percentage,
        totalMarksEarned: gradingResult.totalMarksEarned,
        totalTimeTaken,
        completedAt,
        status: 'completed'
      },
      { new: true }
    ).populate([
      { path: 'test', select: 'title description timeLimit totalMarks totalQuestions' },
      { path: 'student', select: 'name email' }
    ]);

    // Generate performance analytics
    const analytics = AutoGradingService.generatePerformanceAnalytics(gradingResult);

    // Generate study recommendations
    const recommendations = AutoGradingService.generateStudyRecommendations(gradingResult, questions);

    // Update test statistics
    await updateTestStatistics(testId);

    // Prepare response with detailed results
    const response = {
      attempt: updatedAttempt,
      gradingResult,
      analytics,
      recommendations,
      summary: {
        totalQuestions: questions.length,
        correctAnswers: gradingResult.correctAnswers,
        incorrectAnswers: gradingResult.incorrectAnswers,
        totalMarksEarned: gradingResult.totalMarksEarned,
        totalMarks: gradingResult.totalMarks,
        percentage: gradingResult.percentage,
        performanceGrade: analytics.performanceGrade,
        timeTaken: totalTimeTaken,
        submittedAt: completedAt
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Test submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to update test statistics
async function updateTestStatistics(testId: string) {
  try {
    const attempts = await Attempt.find({ test: testId, status: 'completed' });
    
    if (attempts.length > 0) {
      const totalAttempts = attempts.length;
      const averageScore = attempts.reduce((sum: number, attempt: any) => sum + attempt.percentage, 0) / totalAttempts;
      const highestScore = Math.max(...attempts.map((attempt: any) => attempt.percentage));
      const lowestScore = Math.min(...attempts.map((attempt: any) => attempt.percentage));
      
      // Update test with statistics (assuming Test model has these fields)
      await Test.findByIdAndUpdate(testId, {
        $set: {
          'statistics.totalAttempts': totalAttempts,
          'statistics.averageScore': Math.round(averageScore * 100) / 100,
          'statistics.highestScore': highestScore,
          'statistics.lowestScore': lowestScore,
          'statistics.lastUpdated': new Date()
        }
      });
    }
  } catch (error) {
    console.error('Failed to update test statistics:', error);
  }
}

export const POST = requireAuth(submitTestHandler);