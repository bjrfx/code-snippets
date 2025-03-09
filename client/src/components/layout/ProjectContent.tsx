import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Project } from '@shared/schema';

interface ProjectContentProps {
  projectId: string;
  type: 'snippets' | 'notes' | 'checklists';
  userId: string | undefined;
}

export function ProjectContent({ projectId, type, userId }: ProjectContentProps) {
  const { data: items, isLoading, error } = useQuery<any[]>({
    queryKey: ['project-items', userId, projectId, type],
    queryFn: async () => {
      if (!userId || !projectId) return [];
      
      try {
        console.log(`Fetching ${type} for project ${projectId} and user ${userId}`);
        
        // Try first with the composite query (requires index)
        try {
          const q = query(
            collection(db, type),
            where('userId', '==', userId),
            where('projectId', '==', projectId),
            orderBy('updatedAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          console.log(`${type} query snapshot for project:`, querySnapshot.size, 'documents');
          
          const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          return results;
        } catch (indexError: any) {
          // If we get an index error, fall back to a simpler query without ordering
          if (indexError.message && indexError.message.includes('index')) {
            console.warn(`Index error for ${type} in project, falling back to simpler query:`, indexError.message);
            
            const fallbackQuery = query(
              collection(db, type),
              where('userId', '==', userId),
              where('projectId', '==', projectId),
              limit(10) // Limit results as we can't order them
            );
            
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const fallbackResults = fallbackSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            return fallbackResults;
          } else {
            // If it's not an index error, rethrow
            throw indexError;
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type} for project:`, error);
        throw error;
      }
    },
    enabled: !!userId && !!projectId,
    staleTime: 60000, // 1 minute
    retry: 2
  });

  // Log any errors
  if (error) {
    console.error(`Error in ProjectContent (${type}):`, error);
  }

  if (isLoading) {
    return (
      <div className="pl-6 py-1">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded my-1" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded my-1" />
      </div>
    );
  }

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) {
    return (
      <div className="pl-6 py-1 text-xs text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className="pl-6 py-1">
      {safeItems.slice(0, 5).map((item) => (
        <Link key={item.id} href={`/${type}/${item.id}`}>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-auto py-1 px-2 text-xs"
          >
            {item.title || 'Untitled'}
          </Button>
        </Link>
      ))}
      {safeItems.length > 5 && (
        <div className="text-xs text-muted-foreground pl-2 pt-1">
          +{safeItems.length - 5} more items
        </div>
      )}
    </div>
  );
}