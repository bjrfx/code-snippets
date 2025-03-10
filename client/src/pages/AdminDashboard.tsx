import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocation } from 'wouter';
import { ChevronLeft, UserCheck, UserX, Search, RefreshCw, Shield, Trash2 } from 'lucide-react';
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

export default function AdminDashboard() {
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
  
  // Legacy function for backward compatibility
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    const newRole = currentStatus ? USER_ROLES.FREE : USER_ROLES.ADMIN;
    await updateUserRole(userId, newRole);
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
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
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>User Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setLocation(`/admin/users/${user.id}`)}
                        >
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.displayName || 'Not set'}</TableCell>
                          <TableCell>
                            {user.createdAt?.toDate ? 
                              user.createdAt.toDate().toLocaleDateString() : 
                              'Unknown'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : user.role === 'paid' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                              {user.role === 'admin' ? 'Admin' : user.role === 'paid' ? 'Paid' : user.role === 'free' ? 'Free' : 'No Role'}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}> {/* Prevent row click when clicking actions */}
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
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
                                className="flex items-center gap-1"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={user.id === window.user?.uid} // Prevent deleting yourself
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
            <CardDescription>
              Overview of system usage and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </CardContent>
        </Card>
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