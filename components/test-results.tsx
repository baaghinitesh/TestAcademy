'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Award, BarChart, Eye, Download, FileText } from 'lucide-react';

interface Question {
  _id: string;
  question: string;
  questionType: 'single-choice' | 'multiple-choice';
  options: {
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
  }[];
  explanation?: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
  marks: number;
}

interface TestAttempt {
  _id: string;
  test: {
    _id: string;
    title: string;
    description?: string;
    timeLimit: number;
    totalMarks: number;
    totalQuestions: number;
  };
  student: {
    _id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    questionId: string;
    selectedOptions: number[];
    isCorrect: boolean;
    marksEarned: number;
    timeTaken: number;
  }>;
  score: number;
  percentage: number;
  totalMarksEarned: number;
  totalTimeTaken: number;
  startedAt: string;
  completedAt: string;
  status: 'in_progress' | 'completed' | 'submitted';
}

interface TestResultsProps {
  attemptId: string;
  showDetailedReview?: boolean;
}

export default function TestResults({ attemptId, showDetailedReview = true }: TestResultsProps) {
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [showExplanations, setShowExplanations] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // Fetch attempt details
      const attemptResponse = await fetch(`/api/attempts/${attemptId}`);
      const attemptData = await attemptResponse.json();
      
      if (attemptResponse.ok) {
        setAttempt(attemptData);
        
        // Fetch questions for detailed review
        if (showDetailedReview) {
          const questionsResponse = await fetch(`/api/tests/${attemptData.test._id}/questions`);
          const questionsData = await questionsResponse.json();
          
          if (questionsResponse.ok) {
            setQuestions(questionsData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch test results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Test results not found.</p>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'bg-green-500' };
    if (percentage >= 70) return { label: 'Good', color: 'bg-blue-500' };
    if (percentage >= 50) return { label: 'Average', color: 'bg-yellow-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const correctAnswers = attempt.answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = attempt.answers.filter(a => !a.isCorrect).length;
  const badge = getScoreBadge(attempt.percentage);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Results Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium ${badge.color}`}>
            <Award className="h-4 w-4 mr-2" />
            {badge.label}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{attempt.test.title}</h1>
          <p className="text-gray-600 mt-2">Test Results for {attempt.student.name}</p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(attempt.percentage)}`}>
              {attempt.percentage.toFixed(1)}%
            </div>
            <p className="text-gray-600 text-sm">Overall Score</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {attempt.totalMarksEarned}/{attempt.test.totalMarks}
            </div>
            <p className="text-gray-600 text-sm">Marks Earned</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {correctAnswers}/{attempt.test.totalQuestions}
            </div>
            <p className="text-gray-600 text-sm">Correct Answers</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {formatTime(attempt.totalTimeTaken)}
            </div>
            <p className="text-gray-600 text-sm">Time Taken</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{correctAnswers} of {attempt.test.totalQuestions} correct</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(correctAnswers / attempt.test.totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="font-bold text-green-900">{correctAnswers}</div>
              <div className="text-sm text-green-600">Correct</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="font-bold text-red-900">{incorrectAnswers}</div>
              <div className="text-sm text-red-600">Incorrect</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <div className="font-bold text-blue-900">{Math.round(attempt.totalTimeTaken / attempt.test.totalQuestions)}s</div>
              <div className="text-sm text-blue-600">Avg/Question</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <BarChart className="h-8 w-8 text-purple-600" />
            <div>
              <div className="font-bold text-purple-900">{attempt.test.timeLimit}m</div>
              <div className="text-sm text-purple-600">Time Limit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Question Review */}
      {showDetailedReview && questions.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="border-b p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Detailed Review</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExplanations(!showExplanations)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    showExplanations 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="h-4 w-4 inline mr-2" />
                  {showExplanations ? 'Hide' : 'Show'} Explanations
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download Report
                </button>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {questions.map((_, index) => {
                const answer = attempt.answers.find(a => a.questionId === questions[index]._id);
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedQuestion(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                      selectedQuestion === index
                        ? 'bg-blue-600 text-white'
                        : answer?.isCorrect
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Question Review */}
          <div className="p-6">
            {questions[selectedQuestion] && (
              <div className="space-y-6">
                {/* Question */}
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id)?.isCorrect
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}>
                      {selectedQuestion + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {questions[selectedQuestion].question}
                      </h3>
                      {questions[selectedQuestion].questionImageUrl && (
                        <img
                          src={questions[selectedQuestion].questionImageUrl}
                          alt="Question diagram"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {questions[selectedQuestion].marks} marks
                    </div>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {questions[selectedQuestion].options.map((option, optionIndex) => {
                    const answer = attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id);
                    const isSelected = answer?.selectedOptions.includes(optionIndex);
                    const isCorrect = option.isCorrect;
                    
                    let bgColor = 'bg-gray-50';
                    let textColor = 'text-gray-900';
                    let borderColor = 'border-gray-200';
                    
                    if (isCorrect) {
                      bgColor = 'bg-green-50';
                      textColor = 'text-green-900';
                      borderColor = 'border-green-200';
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'bg-red-50';
                      textColor = 'text-red-900';
                      borderColor = 'border-red-200';
                    }

                    return (
                      <div
                        key={optionIndex}
                        className={`p-4 rounded-lg border-2 ${bgColor} ${borderColor}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCorrect 
                              ? 'bg-green-600 text-white' 
                              : isSelected 
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${textColor}`}>
                              {option.text}
                            </div>
                            {option.imageUrl && (
                              <img
                                src={option.imageUrl}
                                alt={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                className="mt-2 max-w-xs h-auto rounded border"
                              />
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isCorrect && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExplanations && questions[selectedQuestion].explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                        <p className="text-blue-800">{questions[selectedQuestion].explanation}</p>
                        {questions[selectedQuestion].explanationImageUrl && (
                          <img
                            src={questions[selectedQuestion].explanationImageUrl}
                            alt="Explanation diagram"
                            className="mt-3 max-w-full h-auto rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Answer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id)?.isCorrect
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id)?.marksEarned || 0}/{questions[selectedQuestion].marks}
                    </div>
                    <p className="text-gray-600 text-sm">Marks Earned</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatTime(attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id)?.timeTaken || 0)}
                    </div>
                    <p className="text-gray-600 text-sm">Time Taken</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id)?.isCorrect
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {attempt.answers.find(a => a.questionId === questions[selectedQuestion]._id)?.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                    <p className="text-gray-600 text-sm">Result</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setSelectedQuestion(Math.max(0, selectedQuestion - 1))}
                    disabled={selectedQuestion === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous Question
                  </button>
                  <button
                    onClick={() => setSelectedQuestion(Math.min(questions.length - 1, selectedQuestion + 1))}
                    disabled={selectedQuestion === questions.length - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}