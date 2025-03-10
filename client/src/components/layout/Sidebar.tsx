import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
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
  CheckSquare,
  Plus,
  Folder,
  Home,
  UserCircle,
  UserCheck
} from 'lucide-react';
import { CreateItemDialog } from '@/components/dialogs/CreateItemDialog';
import { FolderContent } from './FolderContent';
import { ProjectContent } from './ProjectContent';

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({
    snippets: true,
    notes: true,
    checklists: true
  });
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [uncategorizedExpanded, setUncategorizedExpanded] = useState(true);
  const [expandedUncategorized, setExpandedUncategorized] = useState({
    snippets: true,
    notes: true,
    checklists: true
  });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Search functionality
  const [searchResults, setSearchResults] = useState<{
    projects: any[];
    tags: string[];
    snippets: any[];
    notes: any[];
    checklists: any[];
  }>({ projects: [], tags: [], snippets: [], notes: [], checklists: [] });
  
  // Function to handle search
  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) {
      setSearchResults({ projects: [], tags: [], snippets: [], notes: [], checklists: [] });
      return;
    }
    
    const query_lowercase = searchQuery.toLowerCase();
    
    try {
      // Filter projects
      const filteredProjects = projects?.filter(project => 
        project.name.toLowerCase().includes(query_lowercase)
      ) || [];
      
      // Filter tags
      const filteredTags = tags?.filter(tag => 
        tag.toLowerCase().includes(query_lowercase)
      ) || [];
      
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
          (snippet.language?.toLowerCase().includes(query_lowercase))
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
          (note.content?.toLowerCase().includes(query_lowercase))
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
          ))
        );
      
      setSearchResults({
        projects: filteredProjects,
        tags: filteredTags,
        snippets: filteredSnippets,
        notes: filteredNotes,
        checklists: filteredChecklists
      });
      
      // Auto-expand sections with results
      if (filteredProjects.length > 0) setProjectsExpanded(true);
      if (filteredTags.length > 0) setTagsExpanded(true);
      if (filteredSnippets.length > 0 || filteredNotes.length > 0 || filteredChecklists.length > 0) {
        setFoldersExpanded(true);
        if (filteredSnippets.length > 0) setExpandedFolders(prev => ({ ...prev, snippets: true }));
        if (filteredNotes.length > 0) setExpandedFolders(prev => ({ ...prev, notes: true }));
        if (filteredChecklists.length > 0) setExpandedFolders(prev => ({ ...prev, checklists: true }));
      }
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };
  
  // Effect to trigger search when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  // Fetch all projects for the current user
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        
        return projectsData;
      } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
    },
    enabled: !!user
  });

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

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(!!userData.isAdmin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

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
                  placeholder="Search snippets, notes, tags..."
                  className="h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button size="icon" variant="ghost" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Create Project Button */}
              <div className="space-y-1">
                {isCreatingProject ? (
                  <div className="flex gap-2">
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="h-9"
                    />
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        if (!user || !newProjectName.trim()) return;
                        try {
                          const now = Date.now();
                          const projectRef = await addDoc(collection(db, 'projects'), {
                            name: newProjectName.trim(),
                            userId: user.uid,
                            createdAt: now,
                            updatedAt: now
                          });
                          
                          // Create a new project object with the data that was just saved
                          const newProject = {
                            id: projectRef.id,
                            name: newProjectName.trim(),
                            userId: user.uid,
                            createdAt: now,
                            updatedAt: now
                          };
                          
                          // Update the React Query cache to include the new project
                          queryClient.setQueryData(['projects', user.uid], (oldData: any[] | undefined) => {
                            return oldData ? [...oldData, newProject] : [newProject];
                          });
                          
                          // Invalidate queries to ensure consistency
                          queryClient.invalidateQueries({ queryKey: ['projects'] });
                          
                          setNewProjectName('');
                          setIsCreatingProject(false);
                        } catch (error) {
                          console.error('Error creating project:', error);
                        }
                      }}
                      disabled={!newProjectName.trim()}
                    >
                      Create
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsCreatingProject(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsCreatingProject(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Project
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-4">
                <Link href="/">
                  <Button
                    variant={location === '/' ? 'secondary' : 'ghost'}
                    size="icon"
                    title="Home"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button
                    variant={location === '/projects' ? 'secondary' : 'ghost'}
                    size="icon"
                    title="Projects"
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Navigation Links */}
                <div className="space-y-1">
                  <Link href="/">
                    <Button
                      variant={location === '/' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button
                      variant={location === '/projects' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      Projects
                    </Button>
                  </Link>
                </div>
                
                {/* Projects Section */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Projects</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setProjectsExpanded(!projectsExpanded)}
                    >
                      {projectsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {projectsExpanded && (
                    <div className="mt-2 space-y-1">
                      {projectsLoading ? (
                        <div className="pl-2 py-1 text-xs text-muted-foreground">Loading projects...</div>
                      ) : searchQuery.trim() ? (
                        // Show search results for projects
                        searchResults.projects.length > 0 ? (
                          <div className="space-y-1">
                            {searchResults.projects.map((project) => (
                              <div key={project.id}>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-between py-1 px-2 h-auto"
                                  onClick={() => setExpandedProjects(prev => ({
                                    ...prev,
                                    [project.id]: !prev[project.id]
                                  }))}
                                >
                                  <div className="flex items-center">
                                    <Folder className="mr-2 h-4 w-4" />
                                    <span className="text-sm">{project.name}</span>
                                  </div>
                                  {expandedProjects[project.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                                
                                {expandedProjects[project.id] && (
                                  <div className="pl-2 space-y-1">
                                    {/* Project Content Creation Buttons */}
                                    <CreateItemDialog
                                      type="snippet"
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start py-1 px-2 h-auto text-xs"
                                        >
                                          <Code className="mr-2 h-3 w-3" />
                                          New Snippet
                                        </Button>
                                      }
                                    />
                                    <CreateItemDialog
                                      type="note"
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start py-1 px-2 h-auto text-xs"
                                        >
                                          <FileText className="mr-2 h-3 w-3" />
                                          New Note
                                        </Button>
                                      }
                                    />
                                    <CreateItemDialog
                                      type="checklist"
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start py-1 px-2 h-auto text-xs"
                                        >
                                          <CheckSquare className="mr-2 h-3 w-3" />
                                          New Checklist
                                        </Button>
                                      }
                                    />
                                    
                                    {/* Project Content */}
                                    <div className="space-y-1">
                                      <div>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-between py-1 px-2 h-auto text-xs"
                                          onClick={() => {
                                            const newExpandedProjects = {...expandedProjects};
                                            newExpandedProjects[`${project.id}-snippets`] = !newExpandedProjects[`${project.id}-snippets`];
                                            setExpandedProjects(newExpandedProjects);
                                          }}
                                        >
                                          <div className="flex items-center">
                                            <Code className="mr-2 h-3 w-3" />
                                            <span className="text-xs">Snippets</span>
                                          </div>
                                          {expandedProjects[`${project.id}-snippets`] ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                        </Button>
                                        
                                        {expandedProjects[`${project.id}-snippets`] && (
                                          <ProjectContent type="snippets" projectId={project.id} userId={user?.uid} />
                                        )}
                                      </div>
                                      
                                      <div>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-between py-1 px-2 h-auto text-xs"
                                          onClick={() => {
                                            const newExpandedProjects = {...expandedProjects};
                                            newExpandedProjects[`${project.id}-notes`] = !newExpandedProjects[`${project.id}-notes`];
                                            setExpandedProjects(newExpandedProjects);
                                          }}
                                        >
                                          <div className="flex items-center">
                                            <FileText className="mr-2 h-3 w-3" />
                                            <span className="text-xs">Notes</span>
                                          </div>
                                          {expandedProjects[`${project.id}-notes`] ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                        </Button>
                                        
                                        {expandedProjects[`${project.id}-notes`] && (
                                          <ProjectContent type="notes" projectId={project.id} userId={user?.uid} />
                                        )}
                                      </div>
                                      
                                      <div>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-between py-1 px-2 h-auto text-xs"
                                          onClick={() => {
                                            const newExpandedProjects = {...expandedProjects};
                                            newExpandedProjects[`${project.id}-checklists`] = !newExpandedProjects[`${project.id}-checklists`];
                                            setExpandedProjects(newExpandedProjects);
                                          }}
                                        >
                                          <div className="flex items-center">
                                            <CheckSquare className="mr-2 h-3 w-3" />
                                            <span className="text-xs">Checklists</span>
                                          </div>
                                          {expandedProjects[`${project.id}-checklists`] ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                        </Button>
                                        
                                        {expandedProjects[`${project.id}-checklists`] && (
                                          <ProjectContent type="checklists" projectId={project.id} userId={user?.uid} />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="pl-2 py-1 text-xs text-muted-foreground">
                            No matching projects found
                          </div>
                        )
                      ) : projects && projects.length > 0 ? (
                        // Show all projects when no search query
                        <div className="space-y-1">
                          {projects.map((project) => (
                            <div key={project.id}>
                              <Button
                                variant="ghost"
                                className="w-full justify-between py-1 px-2 h-auto"
                                onClick={() => setExpandedProjects(prev => ({
                                  ...prev,
                                  [project.id]: !prev[project.id]
                                }))}
                              >
                                <div className="flex items-center">
                                  <Folder className="mr-2 h-4 w-4" />
                                  <span className="text-sm">{project.name}</span>
                                </div>
                                {expandedProjects[project.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                              
                              {expandedProjects[project.id] && (
                                <div className="pl-2 space-y-1">
                                  {/* Project Content Creation Buttons */}
                                  <CreateItemDialog
                                    type="snippet"
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start py-1 px-2 h-auto text-xs"
                                      >
                                        <Code className="mr-2 h-3 w-3" />
                                        New Snippet
                                      </Button>
                                    }
                                  />
                                  <CreateItemDialog
                                    type="note"
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start py-1 px-2 h-auto text-xs"
                                      >
                                        <FileText className="mr-2 h-3 w-3" />
                                        New Note
                                      </Button>
                                    }
                                  />
                                  <CreateItemDialog
                                    type="checklist"
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start py-1 px-2 h-auto text-xs"
                                      >
                                        <CheckSquare className="mr-2 h-3 w-3" />
                                        New Checklist
                                      </Button>
                                    }
                                  />
                                  
                                  {/* Project Content */}
                                  <div className="space-y-1">
                                    <div>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-between py-1 px-2 h-auto text-xs"
                                        onClick={() => {
                                          const newExpandedProjects = {...expandedProjects};
                                          newExpandedProjects[`${project.id}-snippets`] = !newExpandedProjects[`${project.id}-snippets`];
                                          setExpandedProjects(newExpandedProjects);
                                        }}
                                      >
                                        <div className="flex items-center">
                                          <Code className="mr-2 h-3 w-3" />
                                          <span className="text-xs">Snippets</span>
                                        </div>
                                        {expandedProjects[`${project.id}-snippets`] ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                      </Button>
                                      
                                      {expandedProjects[`${project.id}-snippets`] && (
                                        <ProjectContent type="snippets" projectId={project.id} userId={user?.uid} />
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-between py-1 px-2 h-auto text-xs"
                                        onClick={() => {
                                          const newExpandedProjects = {...expandedProjects};
                                          newExpandedProjects[`${project.id}-notes`] = !newExpandedProjects[`${project.id}-notes`];
                                          setExpandedProjects(newExpandedProjects);
                                        }}
                                      >
                                        <div className="flex items-center">
                                          <FileText className="mr-2 h-3 w-3" />
                                          <span className="text-xs">Notes</span>
                                        </div>
                                        {expandedProjects[`${project.id}-notes`] ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                      </Button>
                                      
                                      {expandedProjects[`${project.id}-notes`] && (
                                        <ProjectContent type="notes" projectId={project.id} userId={user?.uid} />
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-between py-1 px-2 h-auto text-xs"
                                        onClick={() => {
                                          const newExpandedProjects = {...expandedProjects};
                                          newExpandedProjects[`${project.id}-checklists`] = !newExpandedProjects[`${project.id}-checklists`];
                                          setExpandedProjects(newExpandedProjects);
                                        }}
                                      >
                                        <div className="flex items-center">
                                          <CheckSquare className="mr-2 h-3 w-3" />
                                          <span className="text-xs">Checklists</span>
                                        </div>
                                        {expandedProjects[`${project.id}-checklists`] ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                      </Button>
                                      
                                      {expandedProjects[`${project.id}-checklists`] && (
                                        <ProjectContent type="checklists" projectId={project.id} userId={user?.uid} />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-2 py-1 text-xs text-muted-foreground">
                          No projects found. Create one to get started.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* All Folders Section */}
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
                            {searchQuery.trim() && searchResults.snippets.length > 0 && (
                              <Badge variant="outline" className="ml-2">{searchResults.snippets.length}</Badge>
                            )}
                          </div>
                          {expandedFolders.snippets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedFolders.snippets && (
                          searchQuery.trim() ? (
                            // Show search results for snippets
                            searchResults.snippets.length > 0 ? (
                              <div className="pl-6 py-1">
                                {searchResults.snippets.slice(0, 5).map((item) => (
                                  <Link key={item.id} href={`/snippets/${item.id}`}>
                                    <Button 
                                      variant="ghost" 
                                      className="w-full justify-start h-auto py-1 px-2 text-xs"
                                    >
                                      {item.title || 'Untitled'}
                                    </Button>
                                  </Link>
                                ))}
                                {searchResults.snippets.length > 5 && (
                                  <div className="text-xs text-muted-foreground pl-2 pt-1">
                                    +{searchResults.snippets.length - 5} more items
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pl-6 py-1 text-xs text-muted-foreground">
                                No matching snippets found
                              </div>
                            )
                          ) : (
                            <FolderContent type="snippets" userId={user?.uid} />
                          )
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
                            {searchQuery.trim() && searchResults.notes.length > 0 && (
                              <Badge variant="outline" className="ml-2">{searchResults.notes.length}</Badge>
                            )}
                          </div>
                          {expandedFolders.notes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedFolders.notes && (
                          searchQuery.trim() ? (
                            // Show search results for notes
                            searchResults.notes.length > 0 ? (
                              <div className="pl-6 py-1">
                                {searchResults.notes.slice(0, 5).map((item) => (
                                  <Link key={item.id} href={`/notes/${item.id}`}>
                                    <Button 
                                      variant="ghost" 
                                      className="w-full justify-start h-auto py-1 px-2 text-xs"
                                    >
                                      {item.title || 'Untitled'}
                                    </Button>
                                  </Link>
                                ))}
                                {searchResults.notes.length > 5 && (
                                  <div className="text-xs text-muted-foreground pl-2 pt-1">
                                    +{searchResults.notes.length - 5} more items
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pl-6 py-1 text-xs text-muted-foreground">
                                No matching notes found
                              </div>
                            )
                          ) : (
                            <FolderContent type="notes" userId={user?.uid} />
                          )
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
                            {searchQuery.trim() && searchResults.checklists.length > 0 && (
                              <Badge variant="outline" className="ml-2">{searchResults.checklists.length}</Badge>
                            )}
                          </div>
                          {expandedFolders.checklists ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedFolders.checklists && (
                          searchQuery.trim() ? (
                            // Show search results for checklists
                            searchResults.checklists.length > 0 ? (
                              <div className="pl-6 py-1">
                                {searchResults.checklists.slice(0, 5).map((item) => (
                                  <Link key={item.id} href={`/checklists/${item.id}`}>
                                    <Button 
                                      variant="ghost" 
                                      className="w-full justify-start h-auto py-1 px-2 text-xs"
                                    >
                                      {item.title || 'Untitled'}
                                    </Button>
                                  </Link>
                                ))}
                                {searchResults.checklists.length > 5 && (
                                  <div className="text-xs text-muted-foreground pl-2 pt-1">
                                    +{searchResults.checklists.length - 5} more items
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pl-6 py-1 text-xs text-muted-foreground">
                                No matching checklists found
                              </div>
                            )
                          ) : (
                            <FolderContent type="checklists" userId={user?.uid} />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />
                
                {/* Uncategorized Section */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Uncategorized</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setUncategorizedExpanded(!uncategorizedExpanded)}
                    >
                      {uncategorizedExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {uncategorizedExpanded && (
                    <div className="mt-2 space-y-1">
                      {/* Uncategorized Snippets */}
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-1 px-2 h-auto"
                          onClick={() => setExpandedUncategorized(prev => ({ ...prev, snippets: !prev.snippets }))}
                        >
                          <div className="flex items-center">
                            <Code className="mr-2 h-4 w-4" />
                            <span className="text-sm">Snippets</span>
                          </div>
                          {expandedUncategorized.snippets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedUncategorized.snippets && (
                          <ProjectContent type="snippets" projectId="" userId={user?.uid} />
                        )}
                      </div>
                      
                      {/* Uncategorized Notes */}
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-1 px-2 h-auto"
                          onClick={() => setExpandedUncategorized(prev => ({ ...prev, notes: !prev.notes }))}
                        >
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            <span className="text-sm">Notes</span>
                          </div>
                          {expandedUncategorized.notes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedUncategorized.notes && (
                          <ProjectContent type="notes" projectId="" userId={user?.uid} />
                        )}
                      </div>
                      
                      {/* Uncategorized Checklists */}
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-between py-1 px-2 h-auto"
                          onClick={() => setExpandedUncategorized(prev => ({ ...prev, checklists: !prev.checklists }))}
                        >
                          <div className="flex items-center">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <span className="text-sm">Checklists</span>
                          </div>
                          {expandedUncategorized.checklists ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {expandedUncategorized.checklists && (
                          <ProjectContent type="checklists" projectId="" userId={user?.uid} />
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
                      ) : searchQuery.trim() ? (
                        // Show search results for tags
                        searchResults.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pl-2 py-1">
                            {searchResults.tags.map((tag) => (
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
                          <div className="pl-2 py-1 text-xs text-muted-foreground">No matching tags found</div>
                        )
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
            <Link href="/profile">
              <Button
                variant="ghost"
                className={`${isCollapsed ? 'justify-center' : 'w-full justify-start'} ${location === '/profile' ? 'bg-accent' : ''}`}
                title="Profile"
              >
                <UserCircle className={isCollapsed ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
                {!isCollapsed && "Profile"}
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className={`${isCollapsed ? 'justify-center' : 'w-full justify-start'} ${location === '/admin' ? 'bg-accent' : ''}`}
                  title="Admin Dashboard"
                >
                  <UserCheck className={isCollapsed ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
                  {!isCollapsed && "Admin Dashboard"}
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button
                variant="ghost"
                className={`${isCollapsed ? 'justify-center' : 'w-full justify-start'} ${location === '/settings' ? 'bg-accent' : ''}`}
                title="Settings"
              >
                <Settings className={isCollapsed ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
                {!isCollapsed && "Settings"}
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}