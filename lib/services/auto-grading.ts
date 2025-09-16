import { IQuestionEnhanced as IQuestion } from '../../backend/models/QuestionEnhancedV2';

export interface SubmittedAnswer {
  questionId: string;
  selectedOptions: number[];
  timeTaken: number;
}

export interface GradedAnswer {
  questionId: string;
  selectedOptions: number[];
  isCorrect: boolean;
  marksEarned: number;
  timeTaken: number;
  correctOptions: number[];
  explanation?: string;
}

export interface TestGradingResult {
  answers: GradedAnswer[];
  totalMarksEarned: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalTimeTaken: number;
}

export class AutoGradingService {
  /**
   * Grade a single question answer
   */
  static gradeQuestion(
    question: any,
    selectedOptions: number[]
  ): { isCorrect: boolean; marksEarned: number } {
    const correctOptions = question.options
      .map((option: any, index: number) => option.isCorrect ? index : -1)
      .filter((index: number) => index !== -1);

    let isCorrect = false;
    let marksEarned = 0;

    if (question.questionType === 'single-choice') {
      // For single choice: exactly one option should be selected and it should be correct
      if (selectedOptions.length === 1 && correctOptions.includes(selectedOptions[0])) {
        isCorrect = true;
        marksEarned = question.marks;
      }
    } else if (question.questionType === 'multiple-choice') {
      // For multiple choice: all correct options should be selected, no incorrect options
      const selectedSet = new Set(selectedOptions);
      const correctSet = new Set(correctOptions);
      
      // Check if selected options exactly match correct options
      if (selectedSet.size === correctSet.size && 
          [...selectedSet].every(option => correctSet.has(option))) {
        isCorrect = true;
        marksEarned = question.marks;
      } else {
        // Partial marking: give proportional marks for partially correct answers
        const correctSelected = selectedOptions.filter(option => correctOptions.includes(option)).length;
        const incorrectSelected = selectedOptions.filter(option => !correctOptions.includes(option)).length;
        const totalCorrect = correctOptions.length;
        
        if (correctSelected > 0 && incorrectSelected === 0) {
          // Give partial marks if some correct options are selected and no incorrect options
          marksEarned = (correctSelected / totalCorrect) * question.marks;
        }
        // Note: If incorrect options are selected, no marks are awarded
      }
    }

    return { isCorrect, marksEarned };
  }

  /**
   * Grade all answers for a test
   */
  static async gradeTestAttempt(
    questions: any[],
    submittedAnswers: SubmittedAnswer[]
  ): Promise<TestGradingResult> {
    const gradedAnswers: GradedAnswer[] = [];
    let totalMarksEarned = 0;
    let totalMarks = 0;
    let correctAnswers = 0;
    let totalTimeTaken = 0;

    // Create a map for quick question lookup
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    for (const submittedAnswer of submittedAnswers) {
      const question = questionMap.get(submittedAnswer.questionId);
      
      if (!question) {
        console.warn(`Question not found: ${submittedAnswer.questionId}`);
        continue;
      }

      // Grade the individual question
      const { isCorrect, marksEarned } = this.gradeQuestion(question, submittedAnswer.selectedOptions);

      // Get correct options for reference
      const correctOptions = question.options
        .map((option: any, index: number) => option.isCorrect ? index : -1)
        .filter((index: number) => index !== -1);

      // Create graded answer
      const gradedAnswer: GradedAnswer = {
        questionId: submittedAnswer.questionId,
        selectedOptions: submittedAnswer.selectedOptions,
        isCorrect,
        marksEarned,
        timeTaken: submittedAnswer.timeTaken,
        correctOptions,
        explanation: question.explanation
      };

      gradedAnswers.push(gradedAnswer);
      
      // Update totals
      totalMarksEarned += marksEarned;
      totalMarks += question.marks;
      totalTimeTaken += submittedAnswer.timeTaken;
      
      if (isCorrect) {
        correctAnswers++;
      }
    }

    const percentage = totalMarks > 0 ? (totalMarksEarned / totalMarks) * 100 : 0;
    const incorrectAnswers = submittedAnswers.length - correctAnswers;

    return {
      answers: gradedAnswers,
      totalMarksEarned,
      totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      totalTimeTaken
    };
  }

  /**
   * Validate answer format
   */
  static validateAnswer(answer: SubmittedAnswer): { isValid: boolean; error?: string } {
    if (!answer.questionId) {
      return { isValid: false, error: 'Question ID is required' };
    }

    if (!Array.isArray(answer.selectedOptions)) {
      return { isValid: false, error: 'Selected options must be an array' };
    }

    if (answer.selectedOptions.some(option => typeof option !== 'number' || option < 0)) {
      return { isValid: false, error: 'Selected options must be non-negative numbers' };
    }

    if (typeof answer.timeTaken !== 'number' || answer.timeTaken < 0) {
      return { isValid: false, error: 'Time taken must be a non-negative number' };
    }

    return { isValid: true };
  }

  /**
   * Generate performance analytics
   */
  static generatePerformanceAnalytics(gradingResult: TestGradingResult) {
    const { answers, totalMarksEarned, totalMarks, percentage, correctAnswers, totalTimeTaken } = gradingResult;
    
    // Calculate time per question statistics
    const timesPerQuestion = answers.map(a => a.timeTaken);
    const averageTimePerQuestion = timesPerQuestion.length > 0 
      ? timesPerQuestion.reduce((sum, time) => sum + time, 0) / timesPerQuestion.length 
      : 0;
    
    const fastestQuestion = Math.min(...timesPerQuestion);
    const slowestQuestion = Math.max(...timesPerQuestion);

    // Calculate difficulty-based performance
    const easyQuestions = answers.filter(a => {
      // This would need to be enhanced to get difficulty from question data
      return a.timeTaken < averageTimePerQuestion;
    });
    const hardQuestions = answers.filter(a => a.timeTaken > averageTimePerQuestion * 1.5);

    // Performance grade
    let performanceGrade = 'F';
    if (percentage >= 90) performanceGrade = 'A+';
    else if (percentage >= 85) performanceGrade = 'A';
    else if (percentage >= 80) performanceGrade = 'A-';
    else if (percentage >= 75) performanceGrade = 'B+';
    else if (percentage >= 70) performanceGrade = 'B';
    else if (percentage >= 65) performanceGrade = 'B-';
    else if (percentage >= 60) performanceGrade = 'C+';
    else if (percentage >= 55) performanceGrade = 'C';
    else if (percentage >= 50) performanceGrade = 'C-';
    else if (percentage >= 45) performanceGrade = 'D';

    return {
      performanceGrade,
      scorePercentage: percentage,
      accuracyRate: (correctAnswers / answers.length) * 100,
      timeEfficiency: averageTimePerQuestion,
      timeManagement: {
        totalTime: totalTimeTaken,
        averagePerQuestion: averageTimePerQuestion,
        fastestQuestion: fastestQuestion,
        slowestQuestion: slowestQuestion
      },
      strengths: easyQuestions.length > hardQuestions.length ? ['Quick problem solving'] : [],
      improvementAreas: hardQuestions.length > easyQuestions.length ? ['Time management'] : [],
      detailedBreakdown: {
        totalQuestions: answers.length,
        correctAnswers,
        incorrectAnswers: answers.length - correctAnswers,
        marksEarned: totalMarksEarned,
        totalMarks,
        partialCredits: answers.filter(a => a.marksEarned > 0 && !a.isCorrect).length
      }
    };
  }

  /**
   * Generate study recommendations based on performance
   */
  static generateStudyRecommendations(gradingResult: TestGradingResult, questions: any[]) {
    const { answers } = gradingResult;
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    
    const incorrectAnswers = answers.filter(a => !a.isCorrect);
    const slowAnswers = answers.filter(a => a.timeTaken > 300); // More than 5 minutes
    
    const recommendations = [];

    // Topic-based recommendations
    const topicWeaknesses = new Map();
    incorrectAnswers.forEach(answer => {
      const question = questionMap.get(answer.questionId);
      if (question?.topic) {
        const count = topicWeaknesses.get(question.topic) || 0;
        topicWeaknesses.set(question.topic, count + 1);
      }
    });

    // Generate recommendations
    if (incorrectAnswers.length > answers.length * 0.5) {
      recommendations.push({
        type: 'review',
        title: 'Overall Review Needed',
        description: 'Consider reviewing the fundamental concepts before attempting more tests.',
        priority: 'high'
      });
    }

    if (slowAnswers.length > 0) {
      recommendations.push({
        type: 'time_management',
        title: 'Improve Time Management',
        description: 'Practice solving questions within time limits to improve speed.',
        priority: 'medium'
      });
    }

    // Topic-specific recommendations
    for (const [topic, count] of topicWeaknesses.entries()) {
      if (count >= 2) {
        recommendations.push({
          type: 'topic_review',
          title: `Review ${topic}`,
          description: `Multiple questions incorrect in this topic. Focus on understanding key concepts.`,
          priority: 'high'
        });
      }
    }

    return recommendations;
  }
}

export default AutoGradingService;