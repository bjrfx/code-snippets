import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocation } from 'wouter';
import { ChevronLeft, UserCheck, UserX, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

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

  // Toggle admin status
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isAdmin: !currentStatus } : u
        )
      );
      
      setFilteredUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isAdmin: !currentStatus } : u
        )
      );
      
      toast({
        title: 'Success',
        description: `User admin status updated successfully.`
      });
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update admin status.'
      });
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
                      <TableHead>Admin Status</TableHead>
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
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.displayName || 'Not set'}</TableCell>
                          <TableCell>
                            {user.createdAt?.toDate ? 
                              user.createdAt.toDate().toLocaleDateString() : 
                              'Unknown'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAdminStatus(user.id, !!user.isAdmin)}
                              className="flex items-center gap-1"
                            >
                              {user.isAdmin ? (
                                <>
                                  <UserX className="h-4 w-4" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Make Admin
                                </>
                              )}
                            </Button>
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
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium">Admin Users</h3>
                <p className="text-2xl font-bold">
                  {users.filter(user => user.isAdmin).length}
                </p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium">Regular Users</h3>
                <p className="text-2xl font-bold">
                  {users.filter(user => !user.isAdmin).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}