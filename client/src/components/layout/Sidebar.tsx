import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Search,
  FolderClosed,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Code,
  FileText,
  CheckSquare
} from 'lucide-react';
import { CreateItemDialog } from '@/components/dialogs/CreateItemDialog';
import { FolderContent } from './FolderContent';

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({
    snippets: true,
    notes: true,
    checklists: true
  });
  const [tagsExpanded, setTagsExpanded] = useState(true);

  // Fetch all tags from user's items
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      const allTags = new Set<string>();
      
      // Fetch tags from snippets
      const snippetsQuery = query(collection(db, 'snippets'), where('userId', '==', user.uid));
      const snippetsSnapshot = await getDocs(snippetsQuery);
      snippetsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      
      // Fetch tags from notes
      const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const notesSnapshot = await getDocs(notesQuery);
      notesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      
      // Fetch tags from checklists
      const checklistsQuery = query(collection(db, 'checklists'), where('userId', '==', user.uid));
      const checklistsSnapshot = await getDocs(checklistsQuery);
      checklistsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      
      return Array.from(allTags).sort();
    },
    enabled: !!user
  });

  if (!user) return null;

  return (
    <div className={`border-r ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-200`}>
      <div className="flex h-full flex-col">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {!isCollapsed && <h2 className="text-lg font-semibold">Code Snippets</h2>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>

          {!isCollapsed && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search snippets..."
                  className="h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button size="icon" variant="ghost">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <CreateItemDialog
                  type="snippet"
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      New Snippet
                    </Button>
                  }
                />
                <CreateItemDialog
                  type="note"
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      New Note
                    </Button>
                  }
                />
                <CreateItemDialog
                  type="checklist"
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      New Checklist
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {!isCollapsed && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">All Folders</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setFoldersExpanded(!foldersExpanded)}
                    >
                      {foldersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {foldersExpanded && (
                    <div className="mt-2 space-y-1">
                      {/* All Snippets Folder */}
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-1 px-2 h-auto"
                          onClick={() => setExpandedFolders(prev => ({ ...prev, snippets: !prev.snippets }))}
                        >
                          <div className="flex items-center">
                            <Code className="mr-2 h-4 w-4" />
                            <span className="text-sm">All Snippets</span>
                          </div>
                          {expandedFolders.snippets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedFolders.snippets && (
                          <FolderContent type="snippets" userId={user?.uid} />
                        )}
                      </div>
                      
                      {/* All Notes Folder */}
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-1 px-2 h-auto"
                          onClick={() => setExpandedFolders(prev => ({ ...prev, notes: !prev.notes }))}
                        >
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="text-sm">All Notes</span>
                          </div>
                          {expandedFolders.notes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedFolders.notes && (
                          <FolderContent type="notes" userId={user?.uid} />
                        )}
                      </div>
                      
                      {/* All Checklists Folder */}
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-1 px-2 h-auto"
                          onClick={() => setExpandedFolders(prev => ({ ...prev, checklists: !prev.checklists }))}
                        >
                          <div className="flex items-center">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <span className="text-sm">All Checklists</span>
                          </div>
                          {expandedFolders.checklists ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedFolders.checklists && (
                          <FolderContent type="checklists" userId={user?.uid} />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Tags</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setTagsExpanded(!tagsExpanded)}
                    >
                      {tagsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {tagsExpanded && (
                    <div className="mt-2 space-y-1">
                      {tagsLoading ? (
                        <div className="pl-2 py-1 text-xs text-muted-foreground">Loading tags...</div>
                      ) : tags && tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pl-2 py-1">
                          {tags.map((tag) => (
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
                      ) : (
                        <div className="pl-2 py-1 text-xs text-muted-foreground">No tags found</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="mt-auto p-4">
          <nav className="space-y-2">
            <Link href="/settings">
              <Button
                variant="ghost"
                className={`w-full justify-start ${location === '/settings' ? 'bg-accent' : ''}`}
              >
                <Settings className="mr-2 h-4 w-4" />
                {!isCollapsed && "Settings"}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}