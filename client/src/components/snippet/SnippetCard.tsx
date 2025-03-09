import { FC } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'lucide-react';
import type { Snippet } from '@shared/schema';
import { CodeEditor } from './CodeEditor';
import { EditItemDialog } from '../dialogs/EditItemDialog';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface SnippetCardProps {
  snippet: Snippet;
  showActions?: boolean;
}

export const SnippetCard: FC<SnippetCardProps> = ({ snippet, showActions = true }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();



  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'snippets', snippet.id));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({
        title: 'Success',
        description: 'Snippet deleted successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete snippet',
      });
    }
  };

  return (
    <Link href={`/snippets/${snippet.id}`}>
      <div className="cursor-pointer">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{snippet.title}</h3>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                {showActions && (
                  <>
                    <EditItemDialog
                      type="snippet"
                      itemId={snippet.id}
                      defaultValues={snippet}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit snippet"
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
                      title="Delete snippet"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {snippet.description && (
              <p className="text-sm text-muted-foreground">{snippet.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {snippet.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} onClick={(e) => e.stopPropagation()}>
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
            <div className="h-[250px] rounded-md border overflow-auto">
              <CodeEditor
                value={snippet.content}
                language={snippet.language}
                onChange={() => {}}
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Last updated:{' '}
            {new Date(snippet.updatedAt).toLocaleDateString()}
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
};