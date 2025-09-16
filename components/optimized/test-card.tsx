'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen, Play } from 'lucide-react';
import Link from 'next/link';

interface TestCardProps {
  test: {
    _id: string;
    title: string;
    description?: string;
    subject: {
      _id: string;
      name: string;
    };
    classNumber: number;
    duration: number;
    totalQuestions: number;
    actualQuestionCount?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    isPublished: boolean;
    createdBy: {
      name: string;
    };
    createdAt: string;
  };
  showActions?: boolean;
  onEdit?: (testId: string) => void;
  onDelete?: (testId: string) => void;
}

const TestCard = memo(function TestCard({ 
  test, 
  showActions = false, 
  onEdit, 
  onDelete 
}: TestCardProps) {
  const difficultyColor = useMemo(() => {
    switch (test.difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, [test.difficulty]);

  const formattedDate = useMemo(() => {
    return new Date(test.createdAt).toLocaleDateString();
  }, [test.createdAt]);

  const questionCount = useMemo(() => {
    return test.actualQuestionCount ?? test.totalQuestions;
  }, [test.actualQuestionCount, test.totalQuestions]);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 optimize-rendering">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1 line-clamp-1">
              {test.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2">
              {test.description || 'No description provided'}
            </CardDescription>
          </div>
          {!test.isPublished && (
            <Badge variant="outline" className="ml-2 shrink-0">
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Test Info */}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{test.subject?.name || 'Unknown Subject'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Class {test.classNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{test.duration} min</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          <Badge className={difficultyColor} variant="outline">
            {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
          </Badge>
          <Badge variant="outline">
            {questionCount} Questions
          </Badge>
        </div>

        {/* Meta Info */}
        <div className="text-xs text-muted-foreground">
          Created by {test.createdBy?.name} on {formattedDate}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {test.isPublished && (
            <Button asChild size="sm" className="flex-1">
              <Link href={`/test/${test.classNumber}/${test.subject?._id}/${test._id}/instructions`}>
                <Play className="w-4 h-4 mr-1" />
                Start Test
              </Link>
            </Button>
          )}
          
          {showActions && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit?.(test._id)}
                className="flex-1"
              >
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDelete?.(test._id)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TestCard.displayName = 'TestCard';

export default TestCard;