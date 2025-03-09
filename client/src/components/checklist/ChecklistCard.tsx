import { FC } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash } from 'lucide-react';
import { EditItemDialog } from '../dialogs/EditItemDialog';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface ChecklistCardProps {
  checklist: any; // We'll type this properly once we have the schema
  showActions?: boolean;
}

export const ChecklistCard: FC<ChecklistCardProps> = ({ checklist, showActions = true }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const items = checklist.content ? JSON.parse(checklist.content) : [];

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'checklists', checklist.id));
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({
        title: 'Success',
        description: 'Checklist deleted successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete checklist',
      });
    }
  };

  const toggleItem = async (index: number) => {
    try {
      const newItems = [...items];
      newItems[index].checked = !newItems[index].checked;

      await updateDoc(doc(db, 'checklists', checklist.id), {
        content: JSON.stringify(newItems)
      });

      queryClient.invalidateQueries({ queryKey: ['items'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update item',
      });
    }
  };

  return (
    <Link href={`/checklists/${checklist.id}`}>
      <div className="cursor-pointer">
        <Card className="h-full flex flex-col enhanced-card card-hover-effect checklist-card">
          <CardHeader className="space-y-1 card-header-accent">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{checklist.title}</h3>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                {showActions && (
                  <>
                    <EditItemDialog
                      type="checklist"
                      itemId={checklist.id}
                      defaultValues={checklist}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit checklist"
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
                      title="Delete checklist"
                      className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {checklist.description && (
              <p className="text-sm text-muted-foreground">{checklist.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {checklist.tags?.map((tag: string) => (
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
            <ul className="space-y-2">
              {items.map((item: any, index: number) => (
                <li key={index} className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    id={`item-${index}`}
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(index)}
                    className="checkbox-animation"
                  />
                  <label 
                    htmlFor={`item-${index}`}
                    className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''} transition-all duration-200`}
                  >
                    {item.text}
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground card-footer-border">
            <div className="timestamp-badge">
              <span>Last updated:</span>
              <span>{new Date(checklist.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
};