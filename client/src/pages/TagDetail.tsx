import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SnippetCard } from '@/components/snippet/SnippetCard';
import { NoteCard } from '@/components/note/NoteCard';
import { ChecklistCard } from '@/components/checklist/ChecklistCard';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Snippet } from '@shared/schema';

export default function TagDetail() {
  const { tag } = useParams<{ tag: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    const fetchItemsByTag = async () => {
      if (!user || !tag) return;
      
      try {
        setLoading(true);
        const decodedTag = decodeURIComponent(tag);
        
        // Fetch snippets with this tag
        const snippetsQuery = query(
          collection(db, 'snippets'),
          where('userId', '==', user.uid),
          where('tags', 'array-contains', decodedTag)
        );
        const snippetsSnapshot = await getDocs(snippetsQuery);
        const snippetsData = snippetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSnippets(snippetsData);
        
        // Fetch notes with this tag
        const notesQuery = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid),
          where('tags', 'array-contains', decodedTag)
        );
        const notesSnapshot = await getDocs(notesQuery);
        const notesData = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotes(notesData);
        
        // Fetch checklists with this tag
        const checklistsQuery = query(
          collection(db, 'checklists'),
          where('userId', '==', user.uid),
          where('tags', 'array-contains', decodedTag)
        );
        const checklistsSnapshot = await getDocs(checklistsQuery);
        const checklistsData = checklistsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChecklists(checklistsData);
      } catch (error: any) {
        console.error('Error fetching items by tag:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load items'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemsByTag();
  }, [user, tag, toast]);
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[300px] rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      );
    }
    
    const allItems = [];
    if (activeTab === 'all' || activeTab === 'snippets') {
      allItems.push(...snippets);
    }
    if (activeTab === 'all' || activeTab === 'notes') {
      allItems.push(...notes);
    }
    if (activeTab === 'all' || activeTab === 'checklists') {
      allItems.push(...checklists);
    }
    
    if (allItems.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No items found with tag "{decodeURIComponent(tag || '')}".
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allItems.map((item) => {
          if (item.language) { // It's a snippet
            return (
              <SnippetCard
                key={item.id}
                snippet={item as Snippet}
              />
            );
          } else if (item.content && typeof item.content === 'string' && !item.content.startsWith('[{')) {
            // It's a note (content is a string, not a JSON string of checklist items)
            return (
              <NoteCard
                key={item.id}
                note={item}
              />
            );
          } else {
            // It's a checklist
            return (
              <ChecklistCard
                key={item.id}
                checklist={item}
              />
            );
          }
        })}
      </div>
    );
  };
  
  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Tag: {decodeURIComponent(tag || '')}</h1>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="snippets">Snippets ({snippets.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="checklists">Checklists ({checklists.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {renderContent()}
          </TabsContent>
          <TabsContent value="snippets" className="mt-6">
            {renderContent()}
          </TabsContent>
          <TabsContent value="notes" className="mt-6">
            {renderContent()}
          </TabsContent>
          <TabsContent value="checklists" className="mt-6">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}