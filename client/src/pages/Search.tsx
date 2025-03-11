import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SnippetCard } from '@/components/snippet/SnippetCard';
import { NoteCard } from '@/components/note/NoteCard';
import { ChecklistCard } from '@/components/checklist/ChecklistCard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    snippets: any[];
    notes: any[];
    checklists: any[];
    tags: string[];
  }>({ snippets: [], notes: [], checklists: [], tags: [] });

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) {
      setSearchResults({ snippets: [], notes: [], checklists: [], tags: [] });
      return;
    }

    setIsSearching(true);
    const query_lowercase = searchQuery.toLowerCase();

    try {
      // Fetch and filter snippets
      const snippetsQuery = query(
        collection(db, 'snippets'),
        where('userId', '==', user.uid)
      );
      const snippetsSnapshot = await getDocs(snippetsQuery);
      const filteredSnippets = snippetsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(snippet =>
          (snippet.title?.toLowerCase().includes(query_lowercase)) ||
          (snippet.content?.toLowerCase().includes(query_lowercase)) ||
          (snippet.language?.toLowerCase().includes(query_lowercase)) ||
          (snippet.tags?.some((tag: string) => tag.toLowerCase().includes(query_lowercase)))
        );

      // Fetch and filter notes
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid)
      );
      const notesSnapshot = await getDocs(notesQuery);
      const filteredNotes = notesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(note =>
          (note.title?.toLowerCase().includes(query_lowercase)) ||
          (note.content?.toLowerCase().includes(query_lowercase)) ||
          (note.tags?.some((tag: string) => tag.toLowerCase().includes(query_lowercase)))
        );

      // Fetch and filter checklists
      const checklistsQuery = query(
        collection(db, 'checklists'),
        where('userId', '==', user.uid)
      );
      const checklistsSnapshot = await getDocs(checklistsQuery);
      const filteredChecklists = checklistsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(checklist =>
          (checklist.title?.toLowerCase().includes(query_lowercase)) ||
          (checklist.items?.some((item: any) => 
            item.text?.toLowerCase().includes(query_lowercase)
          )) ||
          (checklist.tags?.some((tag: string) => tag.toLowerCase().includes(query_lowercase)))
        );

      // Extract all unique tags from the filtered items
      const allTags = new Set<string>();
      [...filteredSnippets, ...filteredNotes, ...filteredChecklists].forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            if (tag.toLowerCase().includes(query_lowercase)) {
              allTags.add(tag);
            }
          });
        }
      });

      setSearchResults({
        snippets: filteredSnippets,
        notes: filteredNotes,
        checklists: filteredChecklists,
        tags: Array.from(allTags)
      });
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search when Enter key is pressed
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter results based on active tab
  const getFilteredResults = () => {
    if (activeTab === 'all') {
      return {
        snippets: searchResults.snippets,
        notes: searchResults.notes,
        checklists: searchResults.checklists,
        tags: searchResults.tags
      };
    }
    
    return {
      snippets: activeTab === 'snippets' ? searchResults.snippets : [],
      notes: activeTab === 'notes' ? searchResults.notes : [],
      checklists: activeTab === 'checklists' ? searchResults.checklists : [],
      tags: activeTab === 'tags' ? searchResults.tags : []
    };
  };

  const filteredResults = getFilteredResults();
  const hasResults = filteredResults.snippets.length > 0 || 
                    filteredResults.notes.length > 0 || 
                    filteredResults.checklists.length > 0 ||
                    filteredResults.tags.length > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search snippets, notes, checklists, and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {searchQuery && (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="snippets">Snippets</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="checklists">Checklists</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {!hasResults && <p className="text-center text-muted-foreground">No results found</p>}
              
              {filteredResults.snippets.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Snippets</h2>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.snippets.map(snippet => (
                      <SnippetCard key={snippet.id} snippet={snippet} showActions={false} />
                    ))}
                  </div>
                </div>
              )}
              
              {filteredResults.notes.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Notes</h2>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.notes.map(note => (
                      <NoteCard key={note.id} note={note} showActions={false} />
                    ))}
                  </div>
                </div>
              )}
              
              {filteredResults.checklists.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Checklists</h2>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResults.checklists.map(checklist => (
                      <ChecklistCard key={checklist.id} checklist={checklist} showActions={false} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="snippets">
              {filteredResults.snippets.length === 0 ? (
                <p className="text-center text-muted-foreground">No snippets found</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.snippets.map(snippet => (
                    <SnippetCard key={snippet.id} snippet={snippet} showActions={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes">
              {filteredResults.notes.length === 0 ? (
                <p className="text-center text-muted-foreground">No notes found</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.notes.map(note => (
                    <NoteCard key={note.id} note={note} showActions={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklists">
              {filteredResults.checklists.length === 0 ? (
                <p className="text-center text-muted-foreground">No checklists found</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.checklists.map(checklist => (
                    <ChecklistCard key={checklist.id} checklist={checklist} showActions={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}