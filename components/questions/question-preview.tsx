'use client';

import React, { useState } from 'react';
import {
  Eye,
  Clock,
  Award,
  Tag,
  BookOpen,
  Target,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  Image as ImageIcon,
  Calculator,
  Type,
  List,
  ListOrdered
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { QuestionOption } from './options-manager';

export interface QuestionPreviewData {
  id?: string;
  questionText: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'fill-blank' | 'numerical';
  options: QuestionOption[];
  subject: string;
  classNumber: number;
  chapter: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  explanation?: string;
  hint?: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
  tags?: string[];
  estimatedTime?: number;
  bloomsTaxonomy?: string;
  source?: string;
}

interface QuestionPreviewProps {
  question: QuestionPreviewData;
  mode?: 'preview' | 'student' | 'review';
  showMetadata?: boolean;
  showCorrectAnswers?: boolean;
  showExplanation?: boolean;
  onAnswerChange?: (selectedAnswers: string[]) => void;
  className?: string;
}

export function QuestionPreview({
  question,
  mode = 'preview',
  showMetadata = true,
  showCorrectAnswers = false,
  showExplanation = false,
  onAnswerChange,
  className = ""
}: QuestionPreviewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleAnswerChange = (optionId: string, checked: boolean) => {
    let newAnswers: string[];
    
    if (question.questionType === 'single-choice' || question.questionType === 'true-false') {
      newAnswers = checked ? [optionId] : [];
    } else {
      newAnswers = checked 
        ? [...selectedAnswers, optionId]
        : selectedAnswers.filter(id => id !== optionId);
    }
    
    setSelectedAnswers(newAnswers);
    onAnswerChange?.(newAnswers);
  };

  const handleTextAnswerChange = (value: string) => {
    setStudentAnswer(value);
    onAnswerChange?.([value]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'single-choice': return <Target className="h-4 w-4" />;
      case 'multiple-choice': return <List className="h-4 w-4" />;
      case 'true-false': return <CheckCircle className="h-4 w-4" />;
      case 'fill-blank': return <Type className="h-4 w-4" />;
      case 'numerical': return <Calculator className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const correctAnswerIds = question.options?.filter(opt => opt.isCorrect).map(opt => opt.id) || [];
  const isCorrectlyAnswered = mode === 'review' && (
    question.questionType === 'single-choice' || question.questionType === 'true-false'
      ? selectedAnswers.length === 1 && correctAnswerIds.includes(selectedAnswers[0])
      : correctAnswerIds.length > 0 && 
        correctAnswerIds.every(id => selectedAnswers.includes(id)) &&
        selectedAnswers.every(id => correctAnswerIds.includes(id))
  );

  return (
    <Card className={`${className} ${mode === 'student' ? 'border-blue-200' : ''}`}>
      {/* Header with metadata */}
      {showMetadata && (
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getQuestionTypeIcon(question.questionType)}
                <CardTitle className="text-lg capitalize">
                  {question.questionType.replace('-', ' ')} Question
                </CardTitle>
                {mode === 'review' && (
                  <Badge variant={isCorrectlyAnswered ? "default" : "destructive"}>
                    {isCorrectlyAnswered ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {isCorrectlyAnswered ? 'Correct' : 'Incorrect'}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>Class {question.classNumber} - {question.subject}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{question.chapter} › {question.topic}</span>
                  {question.subtopic && <span> › {question.subtopic}</span>}
                </div>
                {question.source && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{question.source}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {question.marks} mark{question.marks !== 1 ? 's' : ''}
              </Badge>
              {question.estimatedTime && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {question.estimatedTime}s
                </Badge>
              )}
            </div>
          </div>

          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {question.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* Question Text */}
        <div className="space-y-4">
          <div
            className="text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.questionText }}
          />
          
          {question.questionImageUrl && (
            <div className="flex justify-center">
              <img
                src={question.questionImageUrl}
                alt="Question illustration"
                className="max-w-full h-auto rounded-lg border shadow-sm"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className="space-y-4">
          {question.questionType === 'single-choice' || question.questionType === 'true-false' ? (
            <RadioGroup 
              value={selectedAnswers[0] || ''} 
              onValueChange={(value) => handleAnswerChange(value, true)}
              disabled={mode === 'preview'}
            >
              <div className="space-y-3">
                {question.options?.map((option, index) => (
                  <div 
                    key={option.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      mode === 'student' ? 'hover:bg-muted/50' : ''
                    } ${
                      showCorrectAnswers && option.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : mode === 'review' && selectedAnswers.includes(option.id) && !option.isCorrect
                        ? 'bg-red-50 border-red-200'
                        : ''
                    }`}
                  >
                    <RadioGroupItem 
                      value={option.id} 
                      id={option.id}
                      className={
                        showCorrectAnswers && option.isCorrect 
                          ? 'border-green-500 text-green-600' 
                          : mode === 'review' && selectedAnswers.includes(option.id) && !option.isCorrect
                          ? 'border-red-500 text-red-600'
                          : ''
                      }
                    />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                        <span className="flex-1">{option.text}</span>
                        {showCorrectAnswers && option.isCorrect && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {mode === 'review' && selectedAnswers.includes(option.id) && !option.isCorrect && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </Label>
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="h-20 w-auto rounded border"
                        />
                      )}
                      {(showExplanation || mode === 'review') && option.explanation && (
                        <div className="text-sm text-muted-foreground italic">
                          {option.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : question.questionType === 'multiple-choice' ? (
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div 
                  key={option.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    mode === 'student' ? 'hover:bg-muted/50' : ''
                  } ${
                    showCorrectAnswers && option.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : mode === 'review' && selectedAnswers.includes(option.id) && !option.isCorrect
                      ? 'bg-red-50 border-red-200'
                      : ''
                  }`}
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedAnswers.includes(option.id)}
                    onCheckedChange={(checked) => handleAnswerChange(option.id, !!checked)}
                    disabled={mode === 'preview'}
                    className={
                      showCorrectAnswers && option.isCorrect 
                        ? 'border-green-500 text-green-600' 
                        : mode === 'review' && selectedAnswers.includes(option.id) && !option.isCorrect
                        ? 'border-red-500 text-red-600'
                        : ''
                    }
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                      <span className="flex-1">{option.text}</span>
                      {showCorrectAnswers && option.isCorrect && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {mode === 'review' && selectedAnswers.includes(option.id) && !option.isCorrect && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </Label>
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt=""
                        className="h-20 w-auto rounded border"
                      />
                    )}
                    {(showExplanation || mode === 'review') && option.explanation && (
                      <div className="text-sm text-muted-foreground italic">
                        {option.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                type={question.questionType === 'numerical' ? 'number' : 'text'}
                value={studentAnswer}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                placeholder={
                  question.questionType === 'numerical' 
                    ? 'Enter your numerical answer' 
                    : 'Enter your answer'
                }
                disabled={mode === 'preview'}
                className={
                  mode === 'review' && question.options?.some(opt => opt.text === studentAnswer)
                    ? 'border-green-500'
                    : mode === 'review' && studentAnswer
                    ? 'border-red-500'
                    : ''
                }
              />
              
              {showCorrectAnswers && question.options && question.options.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-600">Correct Answer(s):</div>
                  <div className="space-y-1">
                    {question.options.map((option, index) => (
                      <Badge key={option.id} variant="outline" className="text-green-600 border-green-300">
                        {option.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hint Section */}
        {question.hint && mode === 'student' && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            
            {showHint && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">{question.hint}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation Section */}
        {question.explanation && (showExplanation || mode === 'review') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              Explanation
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div
                className="text-sm text-blue-800"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
              
              {question.explanationImageUrl && (
                <div className="mt-3 flex justify-center">
                  <img
                    src={question.explanationImageUrl}
                    alt="Explanation illustration"
                    className="max-w-full h-auto rounded border shadow-sm"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Metadata in Preview Mode */}
        {mode === 'preview' && (question.bloomsTaxonomy || question.estimatedTime) && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {question.bloomsTaxonomy && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span>Taxonomy: {question.bloomsTaxonomy}</span>
                </div>
              )}
              {question.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Estimated time: {question.estimatedTime} seconds</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}