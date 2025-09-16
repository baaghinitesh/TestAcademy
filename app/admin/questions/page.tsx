'use client';

import { ErrorBoundary } from '../../../components/error-boundary';
import { EnhancedQuestionManager } from '../../../components/questions/enhanced-question-manager';

export default function QuestionsPage() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <EnhancedQuestionManager />
      </div>
    </ErrorBoundary>
  );
}