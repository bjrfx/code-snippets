import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { CodeEditor } from '../snippet/CodeEditor';
import { TagInput } from '@/components/ui/tag-input';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const baseSchema = {
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().optional(),
};

const snippetSchema = z.object({
  ...baseSchema,
  content: z.string().min(1, 'Content is required'),
  language: z.string().default('javascript'),
});

const noteSchema = z.object({
  ...baseSchema,
  content: z.string().min(1, 'Content is required'),
});

const checklistSchema = z.object({
  ...baseSchema,
  items: z.array(z.object({
    text: z.string(),
    checked: z.boolean(),
  })).default([{ text: '', checked: false }]),
});

type ItemType = 'snippet' | 'note' | 'checklist';

interface EditItemDialogProps {
  type: ItemType;
  itemId: string;
  defaultValues: any;
  trigger: React.ReactNode;
  onEdited?: () => void;
}

export function EditItemDialog({ type, itemId, defaultValues, trigger, onEdited }: EditItemDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [originalItem] = useState(defaultValues); // Store the original item data
  const [checklistItems, setChecklistItems] = useState(
    type === 'checklist' 
      ? JSON.parse(defaultValues.content || '[]')
      : [{ text: '', checked: false }]
  );
  
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Fetch projects for the current user
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    
    fetchProjects();
  }, [user]);

  const createNewProject = async () => {
    if (!user || !newProjectName.trim()) return;
    
    try {
      const now = Date.now();
      const projectRef = await addDoc(collection(db, 'projects'), {
        name: newProjectName.trim(),
        userId: user.uid,
        createdAt: now,
        updatedAt: now
      });
      
      const newProject = {
        id: projectRef.id,
        name: newProjectName.trim()
      };
      
      setProjects([...projects, newProject]);
      form.setValue('projectId', projectRef.id);
      setNewProjectName('');
      setIsCreatingProject(false);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create project. Please try again.'
      });
    }
  };

  const form = useForm<any>({
    resolver: zodResolver(
      type === 'snippet' ? snippetSchema :
      type === 'note' ? noteSchema :
      checklistSchema
    ),
    defaultValues: {
      ...defaultValues,
      content: type === 'checklist' ? '' : defaultValues.content,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You must be logged in to edit items',
        });
        return;
      }

      const collectionName = type === 'snippet' ? 'snippets' : 
                           type === 'note' ? 'notes' : 'checklists';

      // For checklists, convert the items array to a JSON string
      const content = type === 'checklist' ? 
        JSON.stringify(checklistItems.filter(item => item.text.trim())) :
        data.content;

      await updateDoc(doc(db, collectionName, itemId), {
        ...data,
        content,
        updatedAt: serverTimestamp(),
      });

      // Create an updated item object with the new data
      const updatedItem = {
        id: itemId,
        ...data,
        content,
        userId: user.uid,
        updatedAt: new Date().getTime(),
      };

      // Update the React Query cache to include the updated item
      queryClient.setQueryData(['items', user.uid, collectionName], (oldData: any[] | undefined) => {
        if (!oldData) return [updatedItem];
        return oldData.map(item => item.id === itemId ? updatedItem : item);
      });

      // Also update the folder items cache
      queryClient.setQueryData(['folder-items', user.uid, collectionName], (oldData: any[] | undefined) => {
        if (!oldData) return [updatedItem];
        return oldData.map(item => item.id === itemId ? updatedItem : item);
      });

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['folder-items'] });
      
      // Always invalidate project-specific queries, including uncategorized items
      queryClient.invalidateQueries({ queryKey: ['project-items', user.uid, data.projectId || ''] });
      
      // Also invalidate the general uncategorized queries to ensure they update
      if (data.projectId === 'uncategorized' || data.projectId === '' || !data.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-items', user.uid, ''] });
        queryClient.invalidateQueries({ queryKey: ['project-items', user.uid, 'uncategorized'] });
      }
      
      // If the project association was changed, also invalidate the old project's queries
      if (originalItem.projectId && originalItem.projectId !== data.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-items', user.uid, originalItem.projectId] });
      }

      toast({
        title: 'Success',
        description: `${type} updated successfully`,
      });

      setOpen(false);
      onEdited?.();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update item. Please try again.',
      });
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { text: '', checked: false }]);
  };

  const updateChecklistItem = (index: number, text: string) => {
    const newItems = [...checklistItems];
    newItems[index].text = text;
    setChecklistItems(newItems);
  };

  const toggleChecklistItem = (index: number) => {
    const newItems = [...checklistItems];
    newItems[index].checked = !newItems[index].checked;
    setChecklistItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Make changes to your {type}. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={`Enter ${type} title`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Add a description (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {type === 'snippet' && (
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="javascript" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Add tags (press Enter or comma to add)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    {isCreatingProject ? (
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Enter new project name"
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={createNewProject}
                          disabled={!newProjectName.trim()}
                        >
                          Create
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsCreatingProject(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a project or leave empty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="uncategorized">Uncategorized</SelectItem>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreatingProject(true)}
                        >
                          New Project
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {type !== 'checklist' ? (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content *</FormLabel>
                      <FormControl>
                        {type === 'snippet' ? (
                          <div className="h-[400px] rounded-md border">
                            <CodeEditor
                              value={field.value}
                              language={form.getValues('language')}
                              onChange={field.onChange}
                            />
                          </div>
                        ) : (
                          <Textarea 
                            {...field} 
                            placeholder="Enter your note content"
                            className="min-h-[200px]"
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Checklist Items *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChecklistItem}
                    >
                      Add Item
                    </Button>
                  </div>
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={item.text}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        placeholder="Enter checklist item"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleChecklistItem(index)}
                      >
                        {item.checked ? '✓' : '○'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </Form>
        </div>
        <div className="bg-background py-4 px-6 border-t">
          <Button type="submit" className="w-full" onClick={form.handleSubmit(onSubmit)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
