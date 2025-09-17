'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Minus,
  GripVertical,
  Check,
  X,
  Image,
  Type,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
  explanation?: string;
}

interface OptionsManagerProps {
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'fill-blank' | 'numerical';
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
  minOptions?: number;
  maxOptions?: number;
  showPreview?: boolean;
}

export function OptionsManager({
  questionType,
  options,
  onChange,
  minOptions = 2,
  maxOptions = 8,
  showPreview = false
}: OptionsManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(showPreview);

  // Generate unique ID for new options
  const generateId = useCallback(() => {
    return `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new option
  const addOption = useCallback(() => {
    if (options.length >= maxOptions) return;
    
    const newOption: QuestionOption = {
      id: generateId(),
      text: '',
      isCorrect: false
    };

    onChange([...options, newOption]);
  }, [options, maxOptions, onChange, generateId]);

  // Remove option
  const removeOption = useCallback((id: string) => {
    if (options.length <= minOptions) return;
    
    const newOptions = options.filter(option => option.id !== id);
    onChange(newOptions);
  }, [options, minOptions, onChange]);

  // Update option text
  const updateOptionText = useCallback((id: string, text: string) => {
    const newOptions = options.map(option =>
      option.id === id ? { ...option, text } : option
    );
    onChange(newOptions);
  }, [options, onChange]);

  // Update option correctness
  const updateOptionCorrectness = useCallback((id: string, isCorrect: boolean) => {
    let newOptions;
    
    if (questionType === 'single-choice' || questionType === 'true-false') {
      // For single choice, only one option can be correct
      newOptions = options.map(option => ({
        ...option,
        isCorrect: option.id === id ? isCorrect : false
      }));
    } else {
      // For multiple choice, multiple options can be correct
      newOptions = options.map(option =>
        option.id === id ? { ...option, isCorrect } : option
      );
    }
    
    onChange(newOptions);
  }, [options, questionType, onChange]);

  // Update option image URL
  const updateOptionImage = useCallback((id: string, imageUrl: string) => {
    const newOptions = options.map(option =>
      option.id === id ? { ...option, imageUrl } : option
    );
    onChange(newOptions);
  }, [options, onChange]);

  // Update option explanation
  const updateOptionExplanation = useCallback((id: string, explanation: string) => {
    const newOptions = options.map(option =>
      option.id === id ? { ...option, explanation } : option
    );
    onChange(newOptions);
  }, [options, onChange]);

  // Duplicate option
  const duplicateOption = useCallback((id: string) => {
    if (options.length >= maxOptions) return;
    
    const optionToDuplicate = options.find(option => option.id === id);
    if (!optionToDuplicate) return;
    
    const duplicatedOption: QuestionOption = {
      ...optionToDuplicate,
      id: generateId(),
      text: optionToDuplicate.text + ' (Copy)',
      isCorrect: false // Duplicated options are not correct by default
    };
    
    const originalIndex = options.findIndex(option => option.id === id);
    const newOptions = [...options];
    newOptions.splice(originalIndex + 1, 0, duplicatedOption);
    
    onChange(newOptions);
  }, [options, maxOptions, onChange, generateId]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newOptions = [...options];
    const draggedOption = newOptions[draggedIndex];
    
    // Remove dragged option
    newOptions.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newOptions.splice(insertIndex, 0, draggedOption);
    
    onChange(newOptions);
    setDraggedIndex(null);
  }, [draggedIndex, options, onChange]);

  // Initialize options for true-false questions
  React.useEffect(() => {
    if (questionType === 'true-false' && options.length !== 2) {
      const trueOption: QuestionOption = {
        id: generateId(),
        text: 'True',
        isCorrect: false
      };
      const falseOption: QuestionOption = {
        id: generateId(),
        text: 'False',
        isCorrect: false
      };
      onChange([trueOption, falseOption]);
    }
  }, [questionType, options.length, onChange, generateId]);

  // Get validation status
  const getValidationStatus = () => {
    const correctCount = options.filter(opt => opt.isCorrect).length;
    const emptyCount = options.filter(opt => !opt.text.trim()).length;
    
    if (emptyCount > 0) {
      return { valid: false, message: `${emptyCount} option(s) are empty` };
    }
    
    if (correctCount === 0) {
      return { valid: false, message: 'At least one option must be marked as correct' };
    }
    
    if (questionType === 'single-choice' && correctCount > 1) {
      return { valid: false, message: 'Single-choice questions can only have one correct answer' };
    }
    
    if (questionType === 'true-false' && correctCount !== 1) {
      return { valid: false, message: 'True/false questions must have exactly one correct answer' };
    }
    
    return { valid: true, message: 'Options are valid' };
  };

  const validation = getValidationStatus();

  // Render special cases
  if (questionType === 'fill-blank' || questionType === 'numerical') {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Correct Answers</h3>
            <Badge variant={validation.valid ? "default" : "destructive"}>
              {validation.message}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <Input
                  value={option.text}
                  onChange={(e) => updateOptionText(option.id, e.target.value)}
                  placeholder={`Answer ${index + 1}${questionType === 'numerical' ? ' (number)' : ''}`}
                  className="flex-1"
                />
                {options.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(option.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {options.length < maxOptions && (
              <Button
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Alternative Answer
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Answer Options</h3>
            <div className="flex items-center gap-2">
              <Badge variant={validation.valid ? "default" : "destructive"}>
                {validation.message}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {previewMode ? (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Preview Mode</h4>
              {questionType === 'single-choice' ? (
                <RadioGroup className="space-y-2">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1">
                        {option.text || `Option ${index + 1}`}
                        {option.isCorrect && (
                          <Check className="h-4 w-4 text-green-600 ml-2 inline" />
                        )}
                      </Label>
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="h-8 w-8 object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={option.isCorrect}
                        readOnly
                      />
                      <Label className="flex-1">
                        {option.text || `Option ${index + 1}`}
                        {option.isCorrect && (
                          <Check className="h-4 w-4 text-green-600 ml-2 inline" />
                        )}
                      </Label>
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="h-8 w-8 object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-start gap-3 p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* Drag handle */}
                  <div className="flex flex-col items-center gap-1 mt-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>

                  {/* Correct answer indicator */}
                  <div className="mt-2">
                    {questionType === 'single-choice' || questionType === 'true-false' ? (
                      <RadioGroup
                        value={option.isCorrect ? option.id : ''}
                        onValueChange={() => updateOptionCorrectness(option.id, !option.isCorrect)}
                      >
                        <RadioGroupItem
                          value={option.id}
                          className={option.isCorrect ? "border-green-500 text-green-600" : ""}
                        />
                      </RadioGroup>
                    ) : (
                      <Checkbox
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => updateOptionCorrectness(option.id, !!checked)}
                        className={option.isCorrect ? "border-green-500 text-green-600" : ""}
                      />
                    )}
                  </div>

                  {/* Option content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOptionText(option.id, e.target.value)}
                        placeholder={questionType === 'true-false' ? 
                          (index === 0 ? 'True' : 'False') : 
                          `Option ${index + 1}`
                        }
                        className="flex-1"
                        disabled={questionType === 'true-false'}
                      />
                      
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="h-10 w-10 object-cover rounded border"
                        />
                      )}
                    </div>

                    {/* Image URL input */}
                    <Input
                      value={option.imageUrl || ''}
                      onChange={(e) => updateOptionImage(option.id, e.target.value)}
                      placeholder="Image URL (optional)"
                      className="text-sm"
                    />

                    {/* Explanation input */}
                    <Input
                      value={option.explanation || ''}
                      onChange={(e) => updateOptionExplanation(option.id, e.target.value)}
                      placeholder="Explanation for this option (optional)"
                      className="text-sm"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1 mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => duplicateOption(option.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {options.length > minOptions && questionType !== 'true-false' && (
                          <DropdownMenuItem 
                            onClick={() => removeOption(option.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* Add option button */}
              {options.length < maxOptions && questionType !== 'true-false' && (
                <Button
                  variant="outline"
                  onClick={addOption}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
            <span>
              {options.length} option{options.length !== 1 ? 's' : ''} 
              ({options.filter(opt => opt.isCorrect).length} correct)
            </span>
            <span>
              {minOptions}-{maxOptions} options allowed
            </span>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}