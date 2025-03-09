import { FC } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'lucide-react';
import { EditItemDialog } from '../dialogs/EditItemDialog';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface NoteCardProps {
  note: any; // We'll type this properly once we have the schema
  showActions?: boolean;
}

export const NoteCard: FC<NoteCardProps> = ({ note, showActions = true }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Ensure note.tags is always an array
  const tags = note.tags || [];

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'notes', note.id));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete note',
      });
    }
  };

  return (
    <Link href={`/notes/${note.id}`}>
      <div className="cursor-pointer">
        <Card className="h-full flex flex-col enhanced-card card-hover-effect note-card">
          <CardHeader className="space-y-1 card-header-accent">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{note.title}</h3>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                {showActions && (
                  <>
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
                          className="hover:bg-accent/10 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                      onEdited={() => queryClient.invalidateQueries({ queryKey: ['items'] })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      title="Delete note"
                      className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {note.description && (
              <p className="text-sm text-muted-foreground">{note.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} onClick={(e) => e.stopPropagation()}>
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/70 enhanced-tag"
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 fade-in-content">
            <div className="whitespace-pre-wrap content-fade-bottom">{note.content}</div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground card-footer-border">
            <div className="timestamp-badge">
              <span>Last updated:</span>
              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
};