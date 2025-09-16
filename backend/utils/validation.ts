import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'admin']).default('student'),
  class: z.number().min(5).max(10).optional(),
  enrolledSubjects: z.array(z.string()).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required')
});

// Class validation schemas
export const createClassSchema = z.object({
  number: z.number().min(5, 'Class must be between 5 and 10').max(10, 'Class must be between 5 and 10'),
  name: z.string().min(1, 'Class name is required').max(50, 'Class name cannot exceed 50 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  subjects: z.array(z.string()).min(1, 'At least one subject is required')
});

// Subject validation schemas
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(50, 'Subject name cannot exceed 50 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  classNumbers: z.array(z.number().min(5).max(10)).min(1, 'At least one class is required'),
  icon: z.string().optional(),
  color: z.string().optional()
});

// Material validation schemas
export const createMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  type: z.enum(['pdf', 'video', 'document', 'image']),
  subject: z.string().min(1, 'Subject is required'),
  classNumber: z.number().min(5).max(10),
  chapter: z.string().max(100, 'Chapter name cannot exceed 100 characters').optional(),
  topic: z.string().max(100, 'Topic name cannot exceed 100 characters').optional(),
  downloadable: z.boolean().default(false),
  viewable: z.boolean().default(true)
});

// Test validation schemas
const baseTestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  subject: z.string().min(1, 'Subject is required'),
  classNumber: z.number().min(5).max(10),
  chapter: z.string().max(100, 'Chapter name cannot exceed 100 characters').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(300, 'Duration cannot exceed 300 minutes'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  passingMarks: z.number().min(0, 'Passing marks cannot be negative'),
  instructions: z.array(z.string().max(500, 'Instruction cannot exceed 500 characters')).default([]),
  allowedAttempts: z.number().min(1, 'Must allow at least 1 attempt').default(1),
  showResults: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(false),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional()
});

export const createTestSchema = baseTestSchema.refine((data) => data.passingMarks <= data.totalMarks, {
  message: 'Passing marks cannot be greater than total marks',
  path: ['passingMarks']
});

export const updateTestSchema = baseTestSchema.partial();

// Question validation schemas
export const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required').max(500, 'Option text cannot exceed 500 characters'),
  isCorrect: z.boolean().default(false)
});

const baseQuestionSchema = z.object({
  test: z.string().min(1, 'Test ID is required'),
  question: z.string().min(1, 'Question text is required').max(2000, 'Question cannot exceed 2000 characters'),
  questionType: z.enum(['single-choice', 'multiple-choice']).default('single-choice'),
  options: z.array(optionSchema).min(2, 'Must have at least 2 options').max(6, 'Cannot have more than 6 options'),
  explanation: z.string().max(1000, 'Explanation cannot exceed 1000 characters').optional(),
  marks: z.number().min(0.5, 'Minimum marks is 0.5').max(10, 'Maximum marks is 10'),
  order: z.number().min(1, 'Order must be at least 1')
});

export const createQuestionSchema = baseQuestionSchema.refine((data) => {
  const correctOptions = data.options.filter(option => option.isCorrect);
  
  if (data.questionType === 'single-choice') {
    return correctOptions.length === 1;
  } else {
    return correctOptions.length >= 1;
  }
}, {
  message: 'Single-choice questions must have exactly one correct answer, multiple-choice questions must have at least one',
  path: ['options']
});

export const updateQuestionSchema = baseQuestionSchema.partial();

// Attempt validation schemas
export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOptions: z.array(z.number().min(0, 'Option index cannot be negative')),
  timeSpent: z.number().min(0, 'Time spent cannot be negative').default(0)
});

export const startAttemptSchema = z.object({
  testId: z.string().min(1, 'Test ID is required')
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  answers: z.array(submitAnswerSchema)
});

// Validation helper function
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};