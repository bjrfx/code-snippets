import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Pencil, Trash, Copy } from 'lucide-react';
import { CodeEditor } from '@/components/snippet/CodeEditor';
import { EditItemDialog } from '@/components/dialogs/EditItemDialog';
import { useQueryClient } from '@tanstack/react-query';
import { deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Snippet } from '@shared/schema';

export default function SnippetDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSnippet = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const snippetDoc = await getDoc(doc(db, 'snippets', id));
        
        if (snippetDoc.exists()) {
          const snippetData = { id: snippetDoc.id, ...snippetDoc.data() } as Snippet;
          
          // Verify this snippet belongs to the current user
          if (snippetData.userId === user.uid) {
            setSnippet(snippetData);
          } else {
            // Snippet doesn't belong to this user
            toast({
              variant: 'destructive',
              title: 'Access denied',
              description: 'You do not have permission to view this snippet.'
            });
            setLocation('/');
          }
        } else {
          // Snippet not found
          toast({
            variant: 'destructive',
            title: 'Not found',
            description: 'The requested snippet could not be found.'
          });
          setLocation('/');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load snippet'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSnippet();
  }, [id, user, setLocation, toast]);

  const handleCopyToClipboard = async () => {
    if (!snippet) return;
    
    try {
      // Check if the Clipboard API is available
      if (!navigator.clipboard) {
        // Fallback for browsers that don't support the Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = snippet.content;
        
        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        // Execute the copy command
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast({
            title: 'Copied!',
            description: 'Snippet copied to clipboard',
          });
        } else {
          throw new Error('Fallback copy method failed');
        }
      } else {
        // Use the Clipboard API
        await navigator.clipboard.writeText(snippet.content);
        toast({
          title: 'Copied!',
          description: 'Snippet copied to clipboard',
        });
      }
    } catch (error: any) {
      console.error('Copy to clipboard failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to copy to clipboard. This may be due to permission restrictions in your browser.'
      });
    }
  };

  const handleDelete = async () => {
    if (!snippet) return;
    
    try {
      await deleteDoc(doc(db, 'snippets', snippet.id));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['folder-items'] });
      toast({
        title: 'Success',
        description: 'Snippet deleted successfully',
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete snippet',
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

  if (!snippet) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 text-center">
          <p>Snippet not found</p>
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
          <h1 className="text-2xl font-bold">Snippet Details</h1>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{snippet.title}</h3>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyToClipboard}
                  title="Copy snippet to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
                  onEdited={() => {
                    queryClient.invalidateQueries({ queryKey: ['items'] });
                    queryClient.invalidateQueries({ queryKey: ['folder-items'] });
                    // Refresh the current snippet
                    getDoc(doc(db, 'snippets', snippet.id)).then(doc => {
                      if (doc.exists()) {
                        setSnippet({ id: doc.id, ...doc.data() } as Snippet);
                      }
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  title="Delete snippet"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {snippet.description && (
              <p className="text-sm text-muted-foreground">{snippet.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {snippet.tags.map((tag) => (
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
            <div className="rounded-md border overflow-auto">
              <CodeEditor
                value={snippet.content}
                language={snippet.language}
                readOnly={true}
              />
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Last updated: {new Date(snippet.updatedAt).toLocaleDateString()}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}