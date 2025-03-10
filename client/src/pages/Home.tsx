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
import { PremiumFeatureAlert } from '@/components/PremiumFeatureAlert';
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
    enabled: !!user,
    // Ensure we refetch when the component mounts or when the tab changes
    refetchOnMount: true,
    // Reduce staleTime for this specific query to ensure more frequent updates
    staleTime: 5000
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
        {/* Premium Feature Alert for free users */}
        <PremiumFeatureAlert />
        
        <Tabs defaultValue="snippets" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="snippets">Snippets</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
          </TabsList>
          <TabsContent value="snippets" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Snippets</h2>
              <CreateItemDialog
                type="snippet"
                trigger={
                  <Button className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> New Snippet
                  </Button>
                }
              />
            </div>
            {renderContent()}
          </TabsContent>
          <TabsContent value="notes" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Notes</h2>
              <CreateItemDialog
                type="note"
                trigger={
                  <Button className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> New Note
                  </Button>
                }
              />
            </div>
            {renderContent()}
          </TabsContent>
          <TabsContent value="checklists" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Checklists</h2>
              <CreateItemDialog
                type="checklist"
                trigger={
                  <Button className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> New Checklist
                  </Button>
                }
              />
            </div>
            {renderContent()}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}