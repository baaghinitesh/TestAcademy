// Export all models
export { default as User } from './User';
export { default as Class } from './Class';
export { default as Subject } from './Subject';
export { default as Material } from './Material';
export { default as Test } from './Test';
export { default as Question } from './QuestionEnhancedV2'; // Enhanced V2 is now the main Question model
export { default as Attempt } from './Attempt';

// Export enhanced models for direct access
export { default as QuestionEnhancedV2 } from './QuestionEnhancedV2';

// Export legacy for backwards compatibility
export { default as QuestionLegacy } from './Question';

// Export interfaces
export type { IUser } from './User';
export type { IClass } from './Class';
export type { ISubject } from './Subject';
export type { IMaterial } from './Material';
export type { ITest } from './Test';
export type { IQuestionEnhanced as IQuestion, IOptionEnhanced as IOption } from './QuestionEnhancedV2'; // Use enhanced interfaces
export type { IAttempt, IAnswer } from './Attempt';

// Export legacy interfaces for backwards compatibility
export type { IQuestion as IQuestionLegacy, IOption as IOptionLegacy } from './Question';