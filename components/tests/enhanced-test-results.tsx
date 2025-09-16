'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, Flag, Eye, EyeOff, 
  TrendingUp, TrendingDown, Award, BookOpen, 
  BarChart3, PieChart, Target, Lightbulb,
  Download, Share2, RefreshCw, MessageSquare
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';

interface TestResultsProps {
  attempt: {
    _id: string;
    testId: {
      _id: string;
      title: string;
      description: string;
      passingScore: number;
      timeLimit: number;
      maxAttempts: number;
    };
    userId: string;
    attemptNumber: number;
    status: string;
    startTime: string;
    endTime?: string;
    timeSpent: number;
    
    responses: Array<{
      questionId: {
        _id: string;
        question: string;
        type: string;
        options?: string[];
        correctAnswers: string[];
        difficulty: string;
        subject: string;
        chapter?: string;
        topic?: string;
        hint?: string;
        explanation?: string;
        images?: Array<{ url: string; caption?: string }>;
      };
      selectedAnswers: string[];
      textAnswer?: string;
      timeSpent: number;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
      isSkipped: boolean;
      flagged: boolean;
      visitCount: number;
      explanation?: string;
      hint?: string;
      reviewNote?: string;
    }>;
    
    score: {
      totalPoints: number;
      maxPoints: number;
      percentage: number;
      grade: string;
      isPassed: boolean;
      breakdown: {
        correct: number;
        incorrect: number;
        skipped: number;
        flagged: number;
      };
      difficultyBreakdown: {
        beginner: { correct: number; total: number; percentage: number };
        intermediate: { correct: number; total: number; percentage: number };
        advanced: { correct: number; total: number; percentage: number };
      };
      topicBreakdown: Array<{
        topicId: string;
        topicName: string;
        correct: number;
        total: number;
        percentage: number;
      }>;
    };
    
    performance: {
      averageTimePerQuestion: number;
      fastestQuestion: { questionId: string; time: number };
      slowestQuestion: { questionId: string; time: number };
      accuracy: number;
      consistencyScore: number;
      improvementAreas: string[];
      strengths: string[];
    };
    
    feedback: {
      overallFeedback: string;
      improvementSuggestions: string[];
      recommendedStudyMaterials: Array<{
        materialId: string;
        title: string;
        reason: string;
      }>;
      nextSteps: string[];
      motivationalMessage: string;
    };
    
    autoGrading: {
      isAutoGraded: boolean;
      confidence: number;
      needsReview: boolean;
      reviewReason?: string;
    };
  };
  showDetailedAnswers?: boolean;
  allowReAttempt?: boolean;
  onReAttempt?: () => void;
  onReviewMode?: () => void;
}

export function EnhancedTestResults({ 
  attempt, 
  showDetailedAnswers = true,
  allowReAttempt = false,
  onReAttempt,
  onReviewMode 
}: TestResultsProps) {
  const [showExplanations, setShowExplanations] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getGradeColor = (grade: string): string => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 bg-green-50',
      'A': 'text-green-600 bg-green-50',
      'B+': 'text-blue-600 bg-blue-50',
      'B': 'text-blue-600 bg-blue-50',
      'C+': 'text-yellow-600 bg-yellow-50',
      'C': 'text-yellow-600 bg-yellow-50',
      'D': 'text-orange-600 bg-orange-50',
      'F': 'text-red-600 bg-red-50'
    };
    return colors[grade] || 'text-gray-600 bg-gray-50';
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const generateReport = async () => {
    // This would typically call an API to generate a detailed PDF report
    const report = {
      studentName: 'Student Name', // Would come from user data
      testTitle: attempt.testId.title,
      completionDate: new Date(attempt.endTime || attempt.startTime),
      score: attempt.score,
      performance: attempt.performance,
      recommendations: attempt.feedback.improvementSuggestions
    };
    setReportData(report);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <div className={`p-4 rounded-full ${attempt.score.isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
            {attempt.score.isPassed ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
        </div>
        
        <h1 className="text-3xl font-bold">{attempt.testId.title}</h1>
        <p className="text-muted-foreground">{attempt.testId.description}</p>
        
        <div className="flex items-center justify-center space-x-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{attempt.score.percentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${getGradeColor(attempt.score.grade)}`}>
              {attempt.score.grade}
            </div>
            <div className="text-sm text-muted-foreground">Grade</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-semibold">{formatTime(attempt.timeSpent)}</div>
            <div className="text-sm text-muted-foreground">Time Spent</div>
          </div>
        </div>
        
        {attempt.score.isPassed ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Congratulations! You have passed this test.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You need {attempt.testId.passingScore}% to pass. Don't give up - review and try again!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {allowReAttempt && attempt.attemptNumber < attempt.testId.maxAttempts && (
          <Button onClick={onReAttempt} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Test
          </Button>
        )}
        
        <Button variant="outline" onClick={onReviewMode}>
          <Eye className="w-4 h-4 mr-2" />
          Review Questions
        </Button>
        
        <Button variant="outline" onClick={generateReport}>
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        
        <Button variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
      </div>

      {/* Main Results Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Question Review</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="recommendations">Study Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Correct</span>
                    <span className="font-semibold text-green-600">
                      {attempt.score.breakdown.correct}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect</span>
                    <span className="font-semibold text-red-600">
                      {attempt.score.breakdown.incorrect}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skipped</span>
                    <span className="font-semibold text-yellow-600">
                      {attempt.score.breakdown.skipped}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flagged</span>
                    <span className="font-semibold text-blue-600">
                      {attempt.score.breakdown.flagged}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Points</span>
                  <span>{attempt.score.totalPoints}/{attempt.score.maxPoints}</span>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Difficulty Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(attempt.score.difficultyBreakdown).map(([difficulty, stats]) => (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getDifficultyColor(difficulty)}>
                        {difficulty}
                      </Badge>
                      <span className="text-sm font-medium">
                        {stats.correct}/{stats.total} ({stats.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress 
                      value={stats.percentage} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span className="font-semibold">{attempt.performance.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={attempt.performance.accuracy} className="h-2 mt-1" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Consistency</span>
                      <span className="font-semibold">{attempt.performance.consistencyScore.toFixed(1)}%</span>
                    </div>
                    <Progress value={attempt.performance.consistencyScore} className="h-2 mt-1" />
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Average Time/Question</div>
                    <div className="text-lg">{formatTime(Math.round(attempt.performance.averageTimePerQuestion))}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topic Performance */}
          {attempt.score.topicBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Topic-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attempt.score.topicBreakdown.map((topic, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{topic.topicName}</h4>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Score</span>
                        <span>{topic.correct}/{topic.total}</span>
                      </div>
                      <Progress value={topic.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {topic.percentage.toFixed(0)}% accuracy
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Question Review</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
            >
              {showExplanations ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </Button>
          </div>

          <div className="space-y-4">
            {attempt.responses.map((response, index) => (
              <Card key={index} className={`border-l-4 ${
                response.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge className={getDifficultyColor(response.questionId.difficulty)}>
                          {response.questionId.difficulty}
                        </Badge>
                        {response.flagged && (
                          <Badge variant="secondary">
                            <Flag className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        {response.isSkipped && (
                          <Badge variant="secondary">Skipped</Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-lg mb-2">
                        {response.questionId.question}
                      </h4>
                      
                      {response.questionId.images && response.questionId.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {response.questionId.images.map((image, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={image.url}
                              alt={image.caption || `Question image ${imgIndex + 1}`}
                              className="max-w-full h-auto rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${
                        response.isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {response.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">
                          {response.pointsEarned}/{response.maxPoints}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(response.timeSpent)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Options and Answers */}
                  {response.questionId.options && (
                    <div className="space-y-2">
                      {response.questionId.options.map((option, optIndex) => {
                        const isSelected = response.selectedAnswers.includes(option);
                        const isCorrect = response.questionId.correctAnswers.includes(option);
                        
                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded border ${
                              isCorrect ? 'bg-green-50 border-green-200' :
                              isSelected ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {isCorrect && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className={
                                isCorrect ? 'font-medium text-green-800' :
                                isSelected ? 'font-medium text-red-800' :
                                'text-gray-700'
                              }>
                                {option}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Answer */}
                  {response.textAnswer && (
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Your Answer:</div>
                      <div className="p-3 bg-gray-50 rounded border">
                        {response.textAnswer}
                      </div>
                      <div className="font-medium text-sm">Correct Answer(s):</div>
                      <div className="p-3 bg-green-50 rounded border">
                        {response.questionId.correctAnswers.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {showExplanations && (response.explanation || response.questionId.explanation) && (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Explanation:</strong> {response.explanation || response.questionId.explanation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Hint */}
                  {showExplanations && response.questionId.hint && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Hint:</strong> {response.questionId.hint}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Review Note */}
                  {response.reviewNote && (
                    <div className="border-l-4 border-l-blue-500 pl-4 py-2 bg-blue-50">
                      <div className="font-medium text-sm text-blue-800 mb-1">Your Note:</div>
                      <div className="text-blue-700">{response.reviewNote}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attempt.performance.strengths.length > 0 ? (
                    attempt.performance.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{strength}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No specific strengths identified</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attempt.performance.improvementAreas.length > 0 ? (
                    attempt.performance.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-orange-600" />
                        <span>{area}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No improvement areas identified</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(Math.round(attempt.performance.averageTimePerQuestion))}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg per Question</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatTime(attempt.performance.fastestQuestion.time)}
                  </div>
                  <div className="text-sm text-muted-foreground">Fastest</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatTime(attempt.performance.slowestQuestion.time)}
                  </div>
                  <div className="text-sm text-muted-foreground">Slowest</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Overall Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-lg">{attempt.feedback.overallFeedback}</p>
                
                {attempt.feedback.motivationalMessage && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Award className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 font-medium">
                      {attempt.feedback.motivationalMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {attempt.autoGrading.needsReview && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Eye className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Some responses require manual review. Final scores may be adjusted after review.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {attempt.feedback.improvementSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Improvement Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attempt.feedback.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600 mt-1" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {attempt.feedback.recommendedStudyMaterials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Recommended Study Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attempt.feedback.recommendedStudyMaterials.map((material, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{material.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{material.reason}</p>
                      <Button size="sm" variant="outline">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Study Now
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {attempt.feedback.nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attempt.feedback.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}