import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { SnippetCard } from '@/components/snippet/SnippetCard';
import { NoteCard } from '@/components/note/NoteCard';
import { ChecklistCard } from '@/components/checklist/ChecklistCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateItemDialog } from '@/components/dialogs/CreateItemDialog';
import type { Snippet } from '@shared/schema';

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('snippets');

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ['items', user?.uid, activeTab],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, activeTab),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!user
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[300px] rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      );
    }

    if (!items?.length) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No {activeTab} found. Create your first one using the buttons on the left.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          if (activeTab === 'snippets') {
            return (
              <SnippetCard
                key={item.id}
                snippet={item as Snippet}
                showActions={false}
              />
            );
          } else if (activeTab === 'notes') {
            return (
              <NoteCard
                key={item.id}
                note={item}
                showActions={false}
              />
            );
          } else {
            return (
              <ChecklistCard
                key={item.id}
                checklist={item}
                showActions={false}
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-4 relative">
        <Tabs defaultValue="snippets" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="snippets">Snippets</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
          </TabsList>
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
        
        <div className="fixed bottom-6 right-6 z-50">
          <CreateItemDialog
            type={activeTab === 'snippets' ? 'snippet' : activeTab === 'notes' ? 'note' : 'checklist'}
            trigger={
              <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                <Plus className="h-6 w-6" />
              </Button>
            }
          />
        </div>
      </div>
    </MainLayout>
  );
}