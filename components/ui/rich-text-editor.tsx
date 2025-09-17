'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Subscript,
  Superscript,
  Type,
  Palette,
  Image,
  Link,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './button';
import { Separator } from './separator';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { Textarea } from './textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  enableMath?: boolean;
  enableImages?: boolean;
  enableLinks?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  height = "200px",
  enableMath = true,
  enableImages = true,
  enableLinks = true
}: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !isPreviewMode) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isPreviewMode]);

  const executeCommand = (command: string, argument?: string) => {
    document.execCommand(command, false, argument);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const insertMathExpression = (type: 'inline' | 'block') => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const mathElement = document.createElement('span');
      mathElement.className = type === 'inline' ? 'math-inline' : 'math-block';
      mathElement.contentEditable = 'false';
      mathElement.style.backgroundColor = '#f0f0f0';
      mathElement.style.padding = '2px 4px';
      mathElement.style.border = '1px solid #ddd';
      mathElement.style.borderRadius = '3px';
      mathElement.style.fontFamily = 'monospace';
      mathElement.textContent = type === 'inline' ? '\\( x^2 + y^2 = z^2 \\)' : '\\[ \\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n \\]';
      
      range.deleteContents();
      range.insertNode(mathElement);
      updateContent();
    }
  };

  const insertLink = () => {
    if (linkText && linkUrl) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${linkText}</a>`;
      executeCommand('insertHTML', linkHtml);
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const imageHtml = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />`;
      executeCommand('insertHTML', imageHtml);
      setShowImageDialog(false);
      setImageUrl('');
      setImageAlt('');
    }
  };

  const formatButtons = [
    { command: 'bold', icon: Bold, label: 'Bold' },
    { command: 'italic', icon: Italic, label: 'Italic' },
    { command: 'underline', icon: Underline, label: 'Underline' },
  ];

  const alignButtons = [
    { command: 'justifyLeft', icon: AlignLeft, label: 'Align Left' },
    { command: 'justifyCenter', icon: AlignCenter, label: 'Align Center' },
    { command: 'justifyRight', icon: AlignRight, label: 'Align Right' },
  ];

  const listButtons = [
    { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' },
  ];

  const styleButtons = [
    { command: 'formatBlock', argument: 'h3', icon: Type, label: 'Heading' },
    { command: 'formatBlock', argument: 'blockquote', icon: Quote, label: 'Quote' },
    { command: 'formatBlock', argument: 'pre', icon: Code, label: 'Code Block' },
  ];

  // Generate preview HTML
  const getPreviewHtml = () => {
    return value
      .replace(/\\\\?\(/g, '<span class="math-inline">')
      .replace(/\\\\?\)/g, '</span>')
      .replace(/\\\\?\[/g, '<div class="math-block">')
      .replace(/\\\\?\]/g, '</div>');
  };

  return (
    <div className={`border border-input rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50">
        {/* Format buttons */}
        <div className="flex items-center gap-1">
          {formatButtons.map(({ command, icon: Icon, label }) => (
            <Button
              key={command}
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(command)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          {alignButtons.map(({ command, icon: Icon, label }) => (
            <Button
              key={command}
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(command)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* List buttons */}
        <div className="flex items-center gap-1">
          {listButtons.map(({ command, icon: Icon, label }) => (
            <Button
              key={command}
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(command)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Style buttons */}
        <div className="flex items-center gap-1">
          {styleButtons.map(({ command, argument, icon: Icon, label }) => (
            <Button
              key={`${command}-${argument}`}
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(command, argument)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Math buttons */}
        {enableMath && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" title="Insert Math" className="h-8 px-2">
                  <Subscript className="h-4 w-4 mr-1" />
                  <Superscript className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMathExpression('inline')}
                    className="w-full justify-start"
                  >
                    Inline Math
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMathExpression('block')}
                    className="w-full justify-start"
                  >
                    Block Math
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Link button */}
        {enableLinks && (
          <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Link" className="h-8 w-8 p-0">
                <Link className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Link Text</label>
                  <Input
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Enter link text"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>
                <Button onClick={insertLink} size="sm" className="w-full">
                  Insert Link
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Image button */}
        {enableImages && (
          <Popover open={showImageDialog} onOpenChange={setShowImageDialog}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Image" className="h-8 w-8 p-0">
                <Image className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Alt Text</label>
                  <Input
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Description of image"
                    className="mt-1"
                  />
                </div>
                <Button onClick={insertImage} size="sm" className="w-full">
                  Insert Image
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="flex-1" />

        {/* Preview toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
          className="h-8 w-8 p-0"
        >
          {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreviewMode ? (
          <div
            className="p-4 min-h-[200px] prose prose-sm max-w-none"
            style={{ minHeight: height }}
            dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            className="p-4 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[200px]"
            style={{ minHeight: height }}
            onInput={updateContent}
            onBlur={updateContent}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}

        {!isPreviewMode && !value && (
          <div
            className="absolute top-4 left-4 text-muted-foreground pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Math rendering note */}
      {enableMath && value.includes('\\(') && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t border-input bg-muted/50">
          <strong>Math Syntax:</strong> Use \(...\) for inline math and \[...\] for block math equations
        </div>
      )}
    </div>
  );
}

// Custom styles for the editor
const editorStyles = `
  .math-inline {
    background-color: #f0f0f0;
    padding: 2px 4px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }
  
  .math-block {
    background-color: #f0f0f0;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    margin: 8px 0;
    display: block;
  }
  
  .rich-text-editor [contenteditable]:empty:before {
    content: attr(data-placeholder);
    color: #9ca3af;
  }
  
  .rich-text-editor blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 16px;
    margin-left: 0;
    font-style: italic;
  }
  
  .rich-text-editor pre {
    background-color: #f3f4f6;
    padding: 12px;
    border-radius: 4px;
    font-family: monospace;
    overflow-x: auto;
  }
  
  .rich-text-editor h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 16px 0 8px 0;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = editorStyles;
  document.head.appendChild(styleSheet);
}