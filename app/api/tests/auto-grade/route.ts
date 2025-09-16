import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/backend/config/db';
import TestEnhanced from '@/backend/models/TestEnhanced';
import AttemptEnhanced from '@/backend/models/AttemptEnhanced';
import QuestionEnhanced from '@/backend/models/QuestionEnhanced';
import MaterialEnhanced from '@/backend/models/MaterialEnhanced';

interface GradingResponse {
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string;
  confidence: number;
  needsReview: boolean;
  reviewReason?: string;
}

class AutoGradingService {
  
  /**
   * Grade multiple choice questions
   */
  static gradeMCQ(question: any, selectedAnswers: string[]): GradingResponse {
    const correctAnswers = question.correctAnswers || [];
    const isMultipleCorrect = question.hasMultipleCorrectAnswers;
    
    let isCorrect = false;
    let confidence = 100;
    let explanation = '';
    
    if (isMultipleCorrect) {
      // For multiple correct answers, check if all selected are correct and no incorrect ones are selected
      const selectedSet = new Set(selectedAnswers);
      const correctSet = new Set(correctAnswers);
      
      isCorrect = selectedSet.size === correctSet.size && 
                 [...selectedSet].every(answer => correctSet.has(answer));
      
      if (isCorrect) {
        explanation = `Correct! You selected all the right answers: ${correctAnswers.join(', ')}.`;
      } else {
        const correctSelected = selectedAnswers.filter(ans => correctAnswers.includes(ans));
        const incorrectSelected = selectedAnswers.filter(ans => !correctAnswers.includes(ans));
        const missedCorrect = correctAnswers.filter(ans => !selectedAnswers.includes(ans));
        
        explanation = `Incorrect. `;
        if (correctSelected.length > 0) {
          explanation += `You correctly identified: ${correctSelected.join(', ')}. `;
        }
        if (incorrectSelected.length > 0) {
          explanation += `However, these are incorrect: ${incorrectSelected.join(', ')}. `;
        }
        if (missedCorrect.length > 0) {
          explanation += `You missed: ${missedCorrect.join(', ')}. `;
        }
        explanation += `The complete correct answer is: ${correctAnswers.join(', ')}.`;
      }
    } else {
      // Single correct answer
      isCorrect = selectedAnswers.length === 1 && correctAnswers.includes(selectedAnswers[0]);
      
      if (isCorrect) {
        explanation = `Correct! The right answer is: ${selectedAnswers[0]}.`;
      } else if (selectedAnswers.length === 0) {
        explanation = `No answer selected. The correct answer is: ${correctAnswers[0]}.`;
      } else if (selectedAnswers.length > 1) {
        explanation = `Multiple answers selected for a single-choice question. The correct answer is: ${correctAnswers[0]}.`;
      } else {
        explanation = `Incorrect. You selected: ${selectedAnswers[0]}. The correct answer is: ${correctAnswers[0]}.`;
      }
    }
    
    // Add detailed explanation if available
    if (question.explanation) {
      explanation += `\n\nExplanation: ${question.explanation}`;
    }
    
    // Add hint if question was marked as difficult
    if (question.difficulty === 'advanced' && question.hint) {
      explanation += `\n\nHint: ${question.hint}`;
    }
    
    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points || 1 : 0,
      explanation,
      confidence,
      needsReview: false
    };
  }
  
  /**
   * Grade true/false questions
   */
  static gradeTrueFalse(question: any, selectedAnswers: string[]): GradingResponse {
    const correctAnswer = question.correctAnswers?.[0]?.toLowerCase();
    const selectedAnswer = selectedAnswers[0]?.toLowerCase();
    
    const isCorrect = selectedAnswer === correctAnswer;
    
    let explanation = '';
    if (isCorrect) {
      explanation = `Correct! The answer is ${correctAnswer === 'true' ? 'True' : 'False'}.`;
    } else {
      explanation = `Incorrect. The correct answer is ${correctAnswer === 'true' ? 'True' : 'False'}.`;
    }
    
    if (question.explanation) {
      explanation += `\n\nExplanation: ${question.explanation}`;
    }
    
    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points || 1 : 0,
      explanation,
      confidence: 100,
      needsReview: false
    };
  }
  
  /**
   * Grade fill-in-the-blank questions
   */
  static gradeFillInTheBlank(question: any, textAnswer: string): GradingResponse {
    const correctAnswers = question.correctAnswers || [];
    const userAnswer = textAnswer?.trim().toLowerCase() || '';
    
    // Check exact matches
    const exactMatch = correctAnswers.some((correct: string) => 
      correct.toLowerCase().trim() === userAnswer
    );
    
    if (exactMatch) {
      return {
        isCorrect: true,
        pointsEarned: question.points || 1,
        explanation: `Correct! Your answer "${textAnswer}" is exactly right.`,
        confidence: 100,
        needsReview: false
      };
    }
    
    // Check partial matches (fuzzy matching)
    const partialMatches = correctAnswers.filter((correct: string) => {
      const correctLower = correct.toLowerCase().trim();
      return this.calculateSimilarity(userAnswer, correctLower) > 0.8;
    });
    
    if (partialMatches.length > 0) {
      return {
        isCorrect: true,
        pointsEarned: (question.points || 1) * 0.8, // Partial credit
        explanation: `Mostly correct! Your answer "${textAnswer}" is very close to the expected answer.`,
        confidence: 85,
        needsReview: true,
        reviewReason: 'Partial match - may need manual verification'
      };
    }
    
    // Check if answer contains key terms
    const keyTerms = correctAnswers.flatMap((answer: string) => 
      answer.toLowerCase().split(/\s+/).filter(term => term.length > 3)
    );
    
    const containsKeyTerms = keyTerms.some((term: string) => 
      userAnswer.includes(term)
    );
    
    if (containsKeyTerms) {
      return {
        isCorrect: false,
        pointsEarned: (question.points || 1) * 0.3, // Small partial credit
        explanation: `Partially correct. Your answer contains some relevant terms but isn't complete. Expected: ${correctAnswers.join(' or ')}.`,
        confidence: 60,
        needsReview: true,
        reviewReason: 'Contains key terms but incomplete answer'
      };
    }
    
    return {
      isCorrect: false,
      pointsEarned: 0,
      explanation: `Incorrect. The correct answer is: ${correctAnswers.join(' or ')}.`,
      confidence: 95,
      needsReview: false
    };
  }
  
  /**
   * Grade matching questions
   */
  static gradeMatching(question: any, selectedAnswers: string[]): GradingResponse {
    const correctPairs = question.matchingPairs || [];
    const userPairs = selectedAnswers;
    
    let correctCount = 0;
    const totalPairs = correctPairs.length;
    
    // Assuming selectedAnswers is formatted as ["item1:match1", "item2:match2", ...]
    const userPairMap = new Map();
    userPairs.forEach(pair => {
      const [item, match] = pair.split(':');
      if (item && match) {
        userPairMap.set(item.trim(), match.trim());
      }
    });
    
    correctPairs.forEach((correctPair: any) => {
      const userMatch = userPairMap.get(correctPair.item);
      if (userMatch === correctPair.match) {
        correctCount++;
      }
    });
    
    const percentage = correctCount / totalPairs;
    const isCorrect = percentage === 1;
    
    let explanation = '';
    if (isCorrect) {
      explanation = `Perfect! You matched all ${totalPairs} items correctly.`;
    } else {
      explanation = `You matched ${correctCount} out of ${totalPairs} items correctly (${Math.round(percentage * 100)}%).`;
      
      // Show correct answers
      const incorrectPairs = correctPairs.filter((pair: any) => 
        userPairMap.get(pair.item) !== pair.match
      );
      
      if (incorrectPairs.length > 0) {
        explanation += `\n\nCorrect matches:\n`;
        incorrectPairs.forEach((pair: any) => {
          explanation += `${pair.item} → ${pair.match}\n`;
        });
      }
    }
    
    return {
      isCorrect,
      pointsEarned: (question.points || 1) * percentage,
      explanation,
      confidence: 100,
      needsReview: percentage < 1 && percentage > 0.5
    };
  }
  
  /**
   * Calculate string similarity using Levenshtein distance
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - matrix[str2.length][str1.length] / maxLength;
  }
  
  /**
   * Main grading function
   */
  static async gradeAttempt(attemptId: string): Promise<any> {
    try {
      const attempt = await AttemptEnhanced.findById(attemptId)
        .populate('testId')
        .populate('responses.questionId');
      
      if (!attempt) {
        throw new Error('Attempt not found');
      }
      
      const gradedResponses = [];
      let totalPointsEarned = 0;
      let maxPoints = 0;
      let needsManualReview = false;
      const reviewReasons = [];
      
      // Grade each response
      for (const response of attempt.responses) {
        const question = response.questionId as any;
        maxPoints += response.maxPoints;
        
        let gradingResult: GradingResponse;
        
        switch (question.type) {
          case 'multiple_choice':
            gradingResult = this.gradeMCQ(question, response.selectedAnswers);
            break;
            
          case 'true_false':
            gradingResult = this.gradeTrueFalse(question, response.selectedAnswers);
            break;
            
          case 'fill_in_the_blank':
            gradingResult = this.gradeFillInTheBlank(question, response.textAnswer || '');
            break;
            
          case 'matching':
            gradingResult = this.gradeMatching(question, response.selectedAnswers);
            break;
            
          default:
            // Unknown question type - needs manual review
            gradingResult = {
              isCorrect: false,
              pointsEarned: 0,
              explanation: 'This question type requires manual grading.',
              confidence: 0,
              needsReview: true,
              reviewReason: 'Unknown question type'
            };
        }
        
        // Update response with grading results
        response.isCorrect = gradingResult.isCorrect;
        response.pointsEarned = gradingResult.pointsEarned;
        response.explanation = gradingResult.explanation;
        
        totalPointsEarned += gradingResult.pointsEarned;
        
        if (gradingResult.needsReview) {
          needsManualReview = true;
          reviewReasons.push(gradingResult.reviewReason || 'Requires review');
        }
        
        gradedResponses.push({
          questionId: response.questionId,
          ...gradingResult
        });
      }
      
      // Calculate final score
      const percentage = maxPoints > 0 ? (totalPointsEarned / maxPoints) * 100 : 0;
      const test = attempt.testId as any;
      const isPassed = percentage >= test.passingScore;
      
      // Update attempt with results
      attempt.score = {
        totalPoints: totalPointsEarned,
        maxPoints,
        percentage,
        grade: attempt.calculateGrade(),
        isPassed,
        breakdown: {
          correct: gradedResponses.filter(r => r.isCorrect).length,
          incorrect: gradedResponses.filter(r => !r.isCorrect).length,
          skipped: attempt.responses.filter(r => r.isSkipped).length,
          flagged: attempt.responses.filter(r => r.flagged).length
        },
        difficultyBreakdown: {
          beginner: { correct: 0, total: 0, percentage: 0 },
          intermediate: { correct: 0, total: 0, percentage: 0 },
          advanced: { correct: 0, total: 0, percentage: 0 }
        },
        topicBreakdown: []
      };
      
      // Auto-grading metadata
      attempt.autoGrading = {
        isAutoGraded: true,
        gradingTime: new Date(),
        confidence: needsManualReview ? 75 : 95,
        needsReview: needsManualReview,
        reviewReason: reviewReasons.join('; '),
        gradingVersion: '1.0'
      };
      
      // Generate feedback
      attempt.generateFeedback();
      
      // Update status
      if (attempt.status === 'submitted') {
        attempt.status = 'completed';
      }
      
      await attempt.save();
      
      return {
        success: true,
        attemptId,
        score: attempt.score,
        autoGrading: attempt.autoGrading,
        feedback: attempt.feedback
      };
      
    } catch (error) {
      console.error('Auto-grading error:', error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { attemptId } = await request.json();
    
    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: 'Attempt ID is required' },
        { status: 400 }
      );
    }
    
    const result = await AutoGradingService.gradeAttempt(attemptId);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Auto-grading API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Auto-grading failed' },
      { status: 500 }
    );
  }
}

// Batch grading endpoint
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const { attemptIds } = await request.json();
    
    if (!attemptIds || !Array.isArray(attemptIds)) {
      return NextResponse.json(
        { success: false, message: 'Array of attempt IDs is required' },
        { status: 400 }
      );
    }
    
    const results = [];
    const errors = [];
    
    for (const attemptId of attemptIds) {
      try {
        const result = await AutoGradingService.gradeAttempt(attemptId);
        results.push(result);
      } catch (error: any) {
        errors.push({
          attemptId,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    });
    
  } catch (error: any) {
    console.error('Batch auto-grading error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Batch grading failed' },
      { status: 500 }
    );
  }
}