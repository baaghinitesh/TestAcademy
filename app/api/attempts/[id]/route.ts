import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Attempt, Test, Question } from '../../../../backend/models';
import { requireAuth } from '../../../../backend/middleware/auth';

// GET /api/attempts/[id] - Get attempt details
async function getAttemptHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = request as any;
    await connectToDatabase();

    const attempt = await Attempt.findById(params.id)
      .populate('test', 'title duration totalMarks passingMarks showResults showCorrectAnswers')
      .populate('student', 'name email');

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Check if user owns this attempt or is admin
    if (user.role !== 'admin' && attempt.student._id.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get questions with correct answers if allowed
    let questionsData = null;
    if (attempt.test.showCorrectAnswers || user.role === 'admin') {
      const questions = await Question.find({ 
        test: attempt.test._id, 
        isActive: true 
      }).sort({ order: 1 });
      
      questionsData = questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        correctOptions: q.options.map((opt: any, idx: number) => opt.isCorrect ? idx : -1).filter((idx: number) => idx >= 0),
        explanation: q.explanation,
        marks: q.marks,
        order: q.order
      }));
    }

    return NextResponse.json({
      attempt,
      questions: questionsData
    });

  } catch (error: any) {
    console.error('Get attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/attempts/[id] - Update attempt (auto-save or submit)
async function updateAttemptHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = request as any;
    const body = await request.json();
    
    await connectToDatabase();

    const attempt = await Attempt.findById(params.id);
    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Check if user owns this attempt
    if (attempt.student.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if attempt is still in progress
    if (attempt.status !== 'in-progress') {
      return NextResponse.json(
        { error: 'Attempt is already completed' },
        { status: 400 }
      );
    }

    const { action, answers, questionId, selectedOptions, timeSpent } = body;

    if (action === 'auto-save') {
      // Auto-save current progress
      if (questionId && selectedOptions !== undefined) {
        // Update specific question answer
        const answerIndex = attempt.answers.findIndex(
          (ans: any) => ans.questionId.toString() === questionId
        );
        
        if (answerIndex >= 0) {
          attempt.answers[answerIndex].selectedOptions = selectedOptions;
          attempt.answers[answerIndex].timeSpent = timeSpent || 0;
        }
      }
      
      attempt.autoSaveData = body.autoSaveData || {};
      attempt.lastAutoSave = new Date();
      
      await attempt.save();
      
      return NextResponse.json({
        message: 'Progress auto-saved',
        lastAutoSave: attempt.lastAutoSave
      });

    } else if (action === 'submit') {
      // Submit the attempt
      const test = await Test.findById(attempt.test);
      const questions = await Question.find({ 
        test: attempt.test, 
        isActive: true 
      });

      // Calculate results
      let totalMarksObtained = 0;
      const updatedAnswers = attempt.answers.map((answer: any) => {
        const question = questions.find(q => q._id.toString() === answer.questionId.toString());
        if (!question) return answer;

        const correctOptions = question.options
          .map((opt: any, idx: number) => opt.isCorrect ? idx : -1)
          .filter((idx: number) => idx >= 0);

        let isCorrect = false;
        let marksObtained = 0;

        if (question.questionType === 'single-choice') {
          // Single choice: must select exactly the correct option
          isCorrect = answer.selectedOptions.length === 1 && 
                     correctOptions.includes(answer.selectedOptions[0]);
        } else {
          // Multiple choice: must select all correct options and no incorrect ones
          const selectedSet = new Set(answer.selectedOptions);
          const correctSet = new Set(correctOptions);
          isCorrect = selectedSet.size === correctSet.size && 
                     [...selectedSet].every(opt => correctSet.has(opt));
        }

        if (isCorrect) {
          marksObtained = question.marks;
          totalMarksObtained += marksObtained;
        }

        return {
          ...answer,
          isCorrect,
          marksObtained
        };
      });

      const percentage = (totalMarksObtained / test.totalMarks) * 100;
      const isPassed = totalMarksObtained >= test.passingMarks;

      // Update attempt
      attempt.answers = updatedAnswers;
      attempt.endTime = new Date();
      attempt.submittedTime = new Date();
      attempt.totalTimeSpent = Math.floor((attempt.endTime.getTime() - attempt.startTime.getTime()) / 1000);
      attempt.marksObtained = totalMarksObtained;
      attempt.percentage = Math.round(percentage * 100) / 100;
      attempt.isPassed = isPassed;
      attempt.status = 'completed';

      await attempt.save();

      return NextResponse.json({
        message: 'Attempt submitted successfully',
        attempt: {
          ...attempt.toObject(),
          showResults: test.showResults
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Update attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getAttemptHandler);
export const PUT = requireAuth(updateAttemptHandler);