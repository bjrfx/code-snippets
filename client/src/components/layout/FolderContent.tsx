import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface FolderContentProps {
  type: 'snippets' | 'notes' | 'checklists';
  userId: string | undefined;
}

export function FolderContent({ type, userId }: FolderContentProps) {
  const { data: items, isLoading, error } = useQuery<any[]>({
    queryKey: ['folder-items', userId, type],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        console.log(`Fetching ${type} for user:`, userId);
        
        // Try first with the composite query (requires index)
        try {
          const q = query(
            collection(db, type),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          console.log(`${type} query snapshot:`, querySnapshot.size, 'documents');
          
          const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`${type} processed results:`, results);
          return results;
        } catch (indexError: any) {
          // If we get an index error, fall back to a simpler query without ordering
          if (indexError.message && indexError.message.includes('index')) {
            console.warn(`Index error for ${type}, falling back to simpler query:`, indexError.message);
            
            const fallbackQuery = query(
              collection(db, type),
              where('userId', '==', userId),
              limit(10) // Limit results as we can't order them
            );
            
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const fallbackResults = fallbackSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log(`${type} fallback results:`, fallbackResults);
            return fallbackResults;
          } else {
            // If it's not an index error, rethrow
            throw indexError;
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    retry: 2
  });

  // Log any errors
  if (error) {
    console.error(`Error in FolderContent (${type}):`, error);
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
  
  // Debug log with more context
  console.log(`FolderContent ${type} items:`, safeItems, 'userId:', userId);

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