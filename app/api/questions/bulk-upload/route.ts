import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Question, Subject, Test } from '../../../../backend/models';
import { requireAdmin } from '../../../../backend/middleware/auth';

interface QuestionRow {
  questionText: string;
  type: 'single-choice' | 'multiple-choice';
  options: string;
  correctAnswers: string;
  marks: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  chapter?: string;
  topic?: string;
  tags?: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
}

// POST /api/questions/bulk-upload - Bulk upload questions via CSV
async function bulkUploadHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      csvData, 
      subjectId, 
      classNumber, 
      testId,
      createdBy 
    } = body;

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'CSV data is required and must be an array' },
        { status: 400 }
      );
    }

    if (!subjectId || !classNumber) {
      return NextResponse.json(
        { error: 'Subject ID and class number are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Verify test exists if provided
    let test = null;
    if (testId) {
      test = await Test.findById(testId);
      if (!test) {
        return NextResponse.json(
          { error: 'Test not found' },
          { status: 404 }
        );
      }
    }

    const errors: string[] = [];
    const validQuestions: any[] = [];
    let currentOrder = 1;

    // Get the highest order number if adding to existing test
    if (test) {
      const lastQuestion = await Question.findOne({ test: testId })
        .sort({ order: -1 })
        .select('order');
      currentOrder = (lastQuestion?.order || 0) + 1;
    }

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row: QuestionRow = csvData[i];
      const rowNum = i + 1;

      try {
        // Validate required fields
        if (!row.questionText?.trim()) {
          errors.push(`Row ${rowNum}: Question text is required`);
          continue;
        }

        if (!row.type || !['single-choice', 'multiple-choice'].includes(row.type)) {
          errors.push(`Row ${rowNum}: Type must be 'single-choice' or 'multiple-choice'`);
          continue;
        }

        if (!row.options?.trim()) {
          errors.push(`Row ${rowNum}: Options are required`);
          continue;
        }

        if (!row.correctAnswers?.trim()) {
          errors.push(`Row ${rowNum}: Correct answers are required`);
          continue;
        }

        if (!row.marks || isNaN(row.marks) || row.marks <= 0) {
          errors.push(`Row ${rowNum}: Valid marks are required`);
          continue;
        }

        // Parse options
        const optionsArray = row.options.split('|').map(opt => opt.trim()).filter(Boolean);
        if (optionsArray.length < 2) {
          errors.push(`Row ${rowNum}: At least 2 options are required (separate with |)`);
          continue;
        }

        // Parse correct answers
        const correctAnswersArray = row.correctAnswers.split(',').map(ans => {
          const trimmed = ans.trim();
          const index = parseInt(trimmed) - 1; // Convert 1-based to 0-based
          return isNaN(index) ? trimmed : index;
        });

        // Validate correct answers
        const invalidCorrectAnswers = correctAnswersArray.filter(ans => 
          typeof ans === 'number' ? ans < 0 || ans >= optionsArray.length : !optionsArray.includes(ans)
        );

        if (invalidCorrectAnswers.length > 0) {
          errors.push(`Row ${rowNum}: Invalid correct answers. Use option numbers (1,2,3...) or exact option text`);
          continue;
        }

        // Validate single-choice vs multiple-choice
        if (row.type === 'single-choice' && correctAnswersArray.length !== 1) {
          errors.push(`Row ${rowNum}: Single-choice questions must have exactly one correct answer`);
          continue;
        }

        if (row.type === 'multiple-choice' && correctAnswersArray.length < 1) {
          errors.push(`Row ${rowNum}: Multiple-choice questions must have at least one correct answer`);
          continue;
        }

        // Build options array with correct flags
        const questionOptions = optionsArray.map((text, index) => ({
          text: text.trim(),
          isCorrect: correctAnswersArray.some(ans => 
            typeof ans === 'number' ? ans === index : ans === text.trim()
          ),
          imageUrl: undefined // Will be added later if needed
        }));

        // Parse tags if provided
        const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        // Build question object
        const questionData = {
          question: row.questionText.trim(),
          questionType: row.type,
          subject: subjectId,
          classNumber: parseInt(classNumber.toString()),
          chapter: row.chapter?.trim(),
          topic: row.topic?.trim(),
          difficulty: row.difficulty || 'medium',
          marks: parseFloat(row.marks.toString()),
          options: questionOptions,
          explanation: row.explanation?.trim(),
          questionImageUrl: row.questionImageUrl?.trim(),
          explanationImageUrl: row.explanationImageUrl?.trim(),
          tags,
          order: currentOrder++,
          isActive: true,
          createdBy: createdBy,
          test: testId || undefined
        };

        validQuestions.push(questionData);

      } catch (error) {
        errors.push(`Row ${rowNum}: Error processing row - ${error}`);
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation errors found',
          errors,
          processedRows: csvData.length,
          validRows: validQuestions.length,
          errorRows: errors.length
        },
        { status: 400 }
      );
    }

    // Save all valid questions
    const savedQuestions = await Question.insertMany(validQuestions);

    // Update test statistics if test was provided
    if (test) {
      const questionCount = await Question.countDocuments({ test: testId, isActive: true });
      const totalMarksResult = await Question.aggregate([
        { $match: { test: testId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$marks' } } }
      ]);

      await Test.findByIdAndUpdate(testId, {
        totalQuestions: questionCount,
        totalMarks: totalMarksResult[0]?.total || 0
      });
    }

    return NextResponse.json({
      message: 'Questions uploaded successfully',
      results: {
        totalRows: csvData.length,
        successfulUploads: savedQuestions.length,
        errors: errors.length,
        questions: savedQuestions
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = requireAdmin(bulkUploadHandler);