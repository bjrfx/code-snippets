import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from './badge';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  className,
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or comma
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    }
  };

  const addTag = (tag: string) => {
    // Remove commas and trim
    tag = tag.replace(/,/g, '').trim();
    
    // Don't add if empty or already exists
    if (!tag || value.includes(tag) || value.length >= maxTags) return;
    
    const newTags = [...value, tag];
    onChange(newTags);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = value.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  return (
    <div className={cn('flex flex-wrap gap-2 p-1 border rounded-md', className)}>
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          <X
            className="h-3 w-3 cursor-pointer hover:text-destructive"
            onClick={() => removeTag(tag)}
          />
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 border-0 p-0 text-sm focus-visible:ring-0 min-w-[120px] h-7"
      />
    </div>
  );
}