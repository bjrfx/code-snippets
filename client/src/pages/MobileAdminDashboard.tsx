import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { ChevronLeft, UserCheck, UserX, Search, RefreshCw, Shield, Trash2, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, doc, updateDoc, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { PremiumRequestsManager } from '@/components/admin/PremiumRequestsManager';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MobileAdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('users'); // 'users', 'stats', 'requests'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load users.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, toast]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.email?.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // User roles configuration
  const USER_ROLES = {
    FREE: 'free',
    PAID: 'paid',
    ADMIN: 'admin'
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Prepare update data
      const updateData = {
        role: newRole,
        // Keep isAdmin field for backward compatibility
        isAdmin: newRole === USER_ROLES.ADMIN
      };
      
      await updateDoc(doc(db, 'users', userId), updateData);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole, isAdmin: newRole === USER_ROLES.ADMIN } : u
        )
      );
      
      setFilteredUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole, isAdmin: newRole === USER_ROLES.ADMIN } : u
        )
      );
      
      toast({
        title: 'Success',
        description: `User role updated to ${newRole} successfully.`
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role.'
      });
    }
  };

  // Delete user and all their data
  const deleteUser = async (userId: string) => {
    if (!userId) return;
    
    try {
      setIsDeleting(true);
      const batch = writeBatch(db);
      
      // Delete user's snippets
      const snippetsQuery = query(collection(db, 'snippets'), where('userId', '==', userId));
      const snippetsSnapshot = await getDocs(snippetsQuery);
      snippetsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user's notes
      const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId));
      const notesSnapshot = await getDocs(notesQuery);
      notesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user's checklists
      const checklistsQuery = query(collection(db, 'checklists'), where('userId', '==', userId));
      const checklistsSnapshot = await getDocs(checklistsQuery);
      checklistsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user's projects
      const projectsQuery = query(collection(db, 'projects'), where('userId', '==', userId));
      const projectsSnapshot = await getDocs(projectsQuery);
      projectsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user's backups
      const backupsQuery = query(collection(db, 'backups'), where('userId', '==', userId));
      const backupsSnapshot = await getDocs(backupsQuery);
      backupsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user's storage files
      try {
        const storageRef = ref(storage, `backups/${userId}`);
        const filesList = await listAll(storageRef);
        
        // Delete each file in the user's storage
        const deletePromises = filesList.items.map(fileRef => deleteObject(fileRef));
        await Promise.all(deletePromises);
      } catch (storageError) {
        console.error('Error deleting storage files:', storageError);
        // Continue with user deletion even if storage deletion fails
      }
      
      // Delete the user document
      batch.delete(doc(db, 'users', userId));
      
      // Commit the batch
      await batch.commit();
      
      // Update local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      setFilteredUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User and all associated data deleted successfully.'
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user and their data.'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Mobile navigation menu
  const MobileNavigation = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between py-2">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 py-4">
              <Button
                variant={activeSection === 'users' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveSection('users');
                  setSidebarOpen(false);
                }}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                User Management
              </Button>
              <Button
                variant={activeSection === 'stats' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveSection('stats');
                  setSidebarOpen(false);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                System Statistics
              </Button>
              <Button
                variant={activeSection === 'requests' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveSection('requests');
                  setSidebarOpen(false);
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Premium Requests
              </Button>
            </div>
          </ScrollArea>
          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation('/')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Render user card for mobile view
  const renderUserCard = (user: any) => (
    <Card key={user.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Email:</span>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Name:</span>
            <div>{user.displayName || 'Not set'}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Created:</span>
            <div>
              {user.createdAt?.toDate ? 
                user.createdAt.toDate().toLocaleDateString() : 
                'Unknown'}
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Role:</span>
            <div>
              <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : user.role === 'paid' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'paid' ? 'Paid' : user.role === 'free' ? 'Free' : 'No Role'}
              </span>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Shield className="h-4 w-4" />
                  Change Role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateUserRole(user.id, USER_ROLES.FREE)}>
                  Set as Free User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateUserRole(user.id, USER_ROLES.PAID)}>
                  Set as Paid User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateUserRole(user.id, USER_ROLES.ADMIN)}>
                  Set as Admin User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setUserToDelete(user);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render stats cards for mobile view
  const renderStatsCards = () => (
    <div className="space-y-4">
      <div className="bg-primary/10 p-4 rounded-lg">
        <h3 className="text-sm font-medium">Total Users</h3>
        <p className="text-2xl font-bold">{users.length}</p>
      </div>
      <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
        <h3 className="text-sm font-medium text-amber-800">Admin Users</h3>
        <p className="text-2xl font-bold text-amber-800">
          {users.filter(user => user.role === 'admin').length}
        </p>
      </div>
      <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
        <h3 className="text-sm font-medium text-amber-800">Paid Users</h3>
        <p className="text-2xl font-bold text-amber-800">
          {users.filter(user => user.role === 'paid').length}
        </p>
      </div>
      <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
        <h3 className="text-sm font-medium text-blue-800">Free Users</h3>
        <p className="text-2xl font-bold text-blue-800">
          {users.filter(user => user.role === 'free').length}
        </p>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              size="sm"
              className="md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <MobileNavigation />
            <Button
              onClick={() => {
                setLoading(true);
                const fetchUsers = async () => {
                  try {
                    const usersQuery = query(collection(db, 'users'));
                    const usersSnapshot = await getDocs(usersQuery);
                    const usersData = usersSnapshot.docs.map(doc => ({
                      id: doc.id,
                      ...doc.data(),
                    }));
                    
                    setUsers(usersData);
                    setFilteredUsers(usersData);
                    toast({
                      title: 'Success',
                      description: 'User list refreshed.'
                    });
                  } catch (error) {
                    console.error('Error refreshing users:', error);
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Failed to refresh users.'
                    });
                  } finally {
                    setLoading(false);
                  }
                };
                fetchUsers();
              }}
              variant="outline"
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Tabs Navigation */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and admin privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <Button size="icon" variant="ghost">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4">No users found</div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map(user => renderUserCard(user))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Section */}
        {activeSection === 'stats' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Statistics</CardTitle>
              <CardDescription>
                Overview of system usage and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStatsCards()}
            </CardContent>
          </Card>
        )}

        {/* Premium Requests Section */}
        {activeSection === 'requests' && (
          <div className="space-y-4">
            <PremiumRequestsManager />
          </div>
        )}
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This will permanently remove the user and all their data including snippets, notes, checklists, projects, and backups.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userToDelete && (
              <div className="space-y-2">
                <p><strong>Email:</strong> {userToDelete.email}</p>
                <p><strong>Display Name:</strong> {userToDelete.displayName || 'Not set'}</p>
                <p><strong>Role:</strong> {userToDelete.role || 'No Role'}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToDelete && deleteUser(userToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}