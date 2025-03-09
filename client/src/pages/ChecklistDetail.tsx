import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Pencil, Trash } from 'lucide-react';
import { EditItemDialog } from '@/components/dialogs/EditItemDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface Checklist {
  id: string;
  title: string;
  content: string; // JSON string of ChecklistItem[]
  description?: string;
  tags: string[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export default function ChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const checklistDoc = await getDoc(doc(db, 'checklists', id));
        
        if (checklistDoc.exists()) {
          const checklistData = { id: checklistDoc.id, ...checklistDoc.data() } as Checklist;
          
          // Verify this checklist belongs to the current user
          if (checklistData.userId === user.uid) {
            setChecklist(checklistData);
            // Parse the checklist items
            if (checklistData.content) {
              setItems(JSON.parse(checklistData.content));
            }
          } else {
            // Checklist doesn't belong to this user
            toast({
              variant: 'destructive',
              title: 'Access denied',
              description: 'You do not have permission to view this checklist.'
            });
            setLocation('/');
          }
        } else {
          // Checklist not found
          toast({
            variant: 'destructive',
            title: 'Not found',
            description: 'The requested checklist could not be found.'
          });
          setLocation('/');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load checklist'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChecklist();
  }, [id, user, setLocation, toast]);

  const handleDelete = async () => {
    if (!checklist) return;
    
    try {
      await deleteDoc(doc(db, 'checklists', checklist.id));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['folder-items'] });
      toast({
        title: 'Success',
        description: 'Checklist deleted successfully',
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete checklist',
      });
    }
  };

  const toggleItem = async (index: number) => {
    if (!checklist) return;
    
    try {
      const newItems = [...items];
      newItems[index].checked = !newItems[index].checked;
      setItems(newItems);

      await updateDoc(doc(db, 'checklists', checklist.id), {
        content: JSON.stringify(newItems)
      });

      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['folder-items'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update item',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="h-8 w-24 bg-muted animate-pulse rounded mb-4" />
          <div className="h-12 w-3/4 bg-muted animate-pulse rounded mb-6" />
          <div className="h-[400px] bg-muted animate-pulse rounded" />
        </div>
      </MainLayout>
    );
  }

  if (!checklist) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 text-center">
          <p>Checklist not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Go back home
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Checklist Details</h1>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{checklist.title}</h3>
              <div className="flex space-x-2">
                <EditItemDialog
                  type="checklist"
                  itemId={checklist.id}
                  defaultValues={checklist}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit checklist"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                  onEdited={() => {
                    queryClient.invalidateQueries({ queryKey: ['items'] });
                    queryClient.invalidateQueries({ queryKey: ['folder-items'] });
                    // Refresh the current checklist
                    getDoc(doc(db, 'checklists', checklist.id)).then(doc => {
                      if (doc.exists()) {
                        const updatedChecklist = { id: doc.id, ...doc.data() } as Checklist;
                        setChecklist(updatedChecklist);
                        if (updatedChecklist.content) {
                          setItems(JSON.parse(updatedChecklist.content));
                        }
                      }
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  title="Delete checklist"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {checklist.description && (
              <p className="text-sm text-muted-foreground">{checklist.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {checklist.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/70"
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border p-4">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No items in this checklist</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`item-${index}`} 
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(index)}
                      />
                      <label 
                        htmlFor={`item-${index}`}
                        className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Last updated: {new Date(checklist.updatedAt).toLocaleDateString()}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}