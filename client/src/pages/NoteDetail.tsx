import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Pencil, Trash } from 'lucide-react';
import { EditItemDialog } from '@/components/dialogs/EditItemDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchNote = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const noteDoc = await getDoc(doc(db, 'notes', id));
        
        if (noteDoc.exists()) {
          const noteData = { id: noteDoc.id, ...noteDoc.data() } as Note;
          
          // Verify this note belongs to the current user
          if (noteData.userId === user.uid) {
            // Ensure tags is always an array
            noteData.tags = noteData.tags || [];
            setNote(noteData);
          } else {
            // Note doesn't belong to this user
            toast({
              variant: 'destructive',
              title: 'Access denied',
              description: 'You do not have permission to view this note.'
            });
            setLocation('/');
          }
        } else {
          // Note not found
          toast({
            variant: 'destructive',
            title: 'Not found',
            description: 'The requested note could not be found.'
          });
          setLocation('/');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load note'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, user, setLocation, toast]);

  const handleDelete = async () => {
    if (!note) return;
    
    try {
      await deleteDoc(doc(db, 'notes', note.id));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['folder-items'] });
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete note',
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

  if (!note) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 text-center">
          <p>Note not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Go back home
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Ensure tags is always an array
  const tags = note.tags || [];

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
          <h1 className="text-2xl font-bold">Note Details</h1>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{note.title}</h3>
              <div className="flex space-x-2">
                <EditItemDialog
                  type="note"
                  itemId={note.id}
                  defaultValues={{
                    ...note,
                    tags: tags // Ensure tags is always an array in defaultValues
                  }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit note"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                  onEdited={() => {
                    queryClient.invalidateQueries({ queryKey: ['items'] });
                    queryClient.invalidateQueries({ queryKey: ['folder-items'] });
                    // Refresh the current note
                    getDoc(doc(db, 'notes', note.id)).then(doc => {
                      if (doc.exists()) {
                        const updatedNote = { id: doc.id, ...doc.data() } as Note;
                        // Ensure tags is always an array
                        updatedNote.tags = updatedNote.tags || [];
                        setNote(updatedNote);
                      }
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  title="Delete note"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {note.description && (
              <p className="text-sm text-muted-foreground">{note.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
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
            <div className="whitespace-pre-wrap rounded-md p-4 border">
              {note.content}
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Last updated: {new Date(note.updatedAt).toLocaleDateString()}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}