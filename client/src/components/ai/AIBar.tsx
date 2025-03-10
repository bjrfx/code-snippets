import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateContent, generateNote, generateSnippet, generateChecklist } from '@/lib/cohere';

interface AIBarProps {
  onClose?: () => void;
}

export function AIBar({ onClose }: AIBarProps) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Focus the input when the component is expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Reset the prompt when expanding
      setPrompt('');
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setPrompt('');
    if (onClose) onClose();
  };

  const processPrompt = async () => {
    if (!prompt.trim() || !user) return;

    try {
      setIsProcessing(true);

      // Parse the prompt to determine what to create
      const promptLower = prompt.toLowerCase();
      
      // Determine the type of item to create
      let itemType = '';
      if (promptLower.includes('snippet') || promptLower.includes('code')) {
        itemType = 'snippet';
      } else if (promptLower.includes('note')) {
        itemType = 'note';
      } else if (promptLower.includes('checklist') || promptLower.includes('todo')) {
        itemType = 'checklist';
      } else if (promptLower.includes('project')) {
        itemType = 'project';
      } else {
        // Default to note if type is not specified
        itemType = 'note';
      }

      // Extract title (first sentence or up to first period)
      let title = prompt.split('.')[0].trim();
      if (title.length > 50) {
        title = title.substring(0, 50) + '...';
      }

      // Extract content request (everything after the first period or the whole prompt)
      let contentRequest = prompt.includes('.') ? prompt.substring(prompt.indexOf('.') + 1).trim() : prompt;

      // Extract tags (look for hashtags or words after "tags:")
      const tags: string[] = [];
      const hashtagRegex = /#(\w+)/g;
      let match;
      while ((match = hashtagRegex.exec(promptLower)) !== null) {
        tags.push(match[1]);
      }

      // Look for tags: keyword
      const tagsKeywordIndex = promptLower.indexOf('tags:');
      if (tagsKeywordIndex !== -1) {
        const tagsText = prompt.substring(tagsKeywordIndex + 5).trim();
        const tagsList = tagsText.split(',').map(tag => tag.trim());
        tags.push(...tagsList.filter(tag => tag !== ''));
      }

      // Remove tags from content request
      contentRequest = contentRequest.replace(/#\w+/g, '').replace(/tags:.*$/i, '').trim();

      // Generate content based on the item type using Cohere API
      let generatedContent = '';
      let language = 'javascript';

      if (itemType === 'project') {
        // For projects, we'll just use the prompt as is
        generatedContent = contentRequest;
      } else if (itemType === 'snippet') {
        // Generate code snippet
        const result = await generateSnippet(contentRequest);
        generatedContent = result.code;
        language = result.language;
      } else if (itemType === 'note') {
        // Generate note content
        generatedContent = await generateNote(contentRequest);
      } else if (itemType === 'checklist') {
        // Generate checklist items
        const checklistItems = await generateChecklist(contentRequest);
        generatedContent = JSON.stringify(checklistItems);
      }

      // Create the item based on type
      if (itemType === 'project') {
        // Create a new project
        const now = Date.now();
        await addDoc(collection(db, 'projects'), {
          name: title,
          description: generatedContent,
          userId: user.uid,
          createdAt: now,
          updatedAt: now
        });

        // Invalidate projects query
        queryClient.invalidateQueries({ queryKey: ['projects'] });

        toast({
          title: 'Project Created',
          description: `Successfully created project: ${title}`
        });
      } else {
        // For snippets, notes, and checklists
        const collectionName = itemType === 'snippet' ? 'snippets' : 
                             itemType === 'note' ? 'notes' : 'checklists';

        // Create the item
        const docRef = await addDoc(collection(db, collectionName), {
          title,
          description: '',
          content: generatedContent,
          tags,
          userId: user.uid,
          projectId: 'uncategorized',
          language: itemType === 'snippet' ? language : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Create a new item object with the data that was just saved
        const newItem = {
          id: docRef.id,
          title,
          description: '',
          content: generatedContent,
          tags,
          userId: user.uid,
          projectId: 'uncategorized',
          language: itemType === 'snippet' ? language : undefined,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        };

        // Update the React Query cache
        queryClient.setQueryData(['items', user.uid, collectionName], (oldData: any[] | undefined) => {
          return oldData ? [newItem, ...oldData] : [newItem];
        });

        // Also update the folder items cache
        queryClient.setQueryData(['folder-items', user.uid, collectionName], (oldData: any[] | undefined) => {
          return oldData ? [newItem, ...oldData] : [newItem];
        });

        // Invalidate queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['folder-items'] });
        queryClient.invalidateQueries({ queryKey: ['project-items', user.uid, 'uncategorized'] });

        toast({
          title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Created`,
          description: `Successfully created ${itemType}: ${title}`
        });
      }

      // Reset the prompt and close the AI bar
      setPrompt('');
      setIsExpanded(false);
    } catch (error: any) {
      console.error('AI processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process your request. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${isExpanded ? 'w-[600px] max-w-[90vw]' : 'w-auto'}`}>
      {isExpanded ? (
        <div className="bg-card border shadow-lg rounded-full overflow-hidden flex items-center p-1 pl-6 ring-2 ring-primary/20 animate-in fade-in slide-in-from-bottom-4">
          <Input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                processPrompt();
              }
            }}
            disabled={isProcessing}
          />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              onClick={processPrompt}
              className="rounded-full ml-1"
              disabled={!prompt.trim() || isProcessing}
            >
              {isProcessing ? (
                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Send</span>
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={toggleExpand}
          variant="outline"
          className="rounded-full shadow-lg bg-card hover:bg-card/90 border-primary/20 hover:border-primary/30 flex items-center gap-2 px-4 py-2 ring-2 ring-primary/20 border-glow"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Assistant</span>
        </Button>
      )}
    </div>
  );
}