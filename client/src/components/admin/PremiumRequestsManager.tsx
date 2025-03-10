import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { PremiumRequest } from '@/lib/schemas/premiumRequestSchema';

export function PremiumRequestsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<PremiumRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvalDuration, setApprovalDuration] = useState(7); // Default 7 days
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch premium feature requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const requestsQuery = query(
          collection(db, 'premiumRequests'),
          orderBy('createdAt', 'desc')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PremiumRequest[];
        
        setRequests(requestsData);
        filterRequests(requestsData, activeTab, searchQuery);
      } catch (error: any) {
        console.error('Error fetching premium requests:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load premium feature requests.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, toast]);

  // Filter requests based on tab and search query
  const filterRequests = (allRequests: PremiumRequest[], tab: string, query: string) => {
    let filtered = allRequests;
    
    // Filter by tab (status)
    if (tab !== 'all') {
      filtered = filtered.filter(request => request.status === tab);
    }
    
    // Filter by search query
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(request => 
        request.userEmail?.toLowerCase().includes(lowercaseQuery) ||
        request.userName?.toLowerCase().includes(lowercaseQuery) ||
        request.requestedFeature?.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    setFilteredRequests(filtered);
  };

  // Handle tab change
  useEffect(() => {
    filterRequests(requests, activeTab, searchQuery);
  }, [activeTab, searchQuery, requests]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Open review dialog
  const openReviewDialog = (request: PremiumRequest) => {
    setSelectedRequest(request);
    setReviewNotes('');
    setApprovalDuration(7); // Reset to default
    setReviewDialogOpen(true);
  };

  // Handle request approval
  const handleApproveRequest = async () => {
    if (!selectedRequest || !user) return;
    
    try {
      setIsProcessing(true);
      
      const now = Date.now();
      const approvalEndDate = now + (approvalDuration * 24 * 60 * 60 * 1000); // Convert days to milliseconds
      
      // Update the request in Firestore
      await updateDoc(doc(db, 'premiumRequests', selectedRequest.id!), {
        status: 'approved',
        reviewedBy: user.uid,
        reviewNotes: reviewNotes,
        updatedAt: now,
        approvalStartDate: now,
        approvalEndDate: approvalEndDate,
        approvalDuration: approvalDuration
      });
      
      // Update the user's role temporarily to 'paid'
      await updateDoc(doc(db, 'users', selectedRequest.userId), {
        temporaryPremiumAccess: true,
        temporaryPremiumExpiry: approvalEndDate
      });
      
      // Update local state
      const updatedRequests = requests.map(req => 
        req.id === selectedRequest.id ? {
          ...req,
          status: 'approved',
          reviewedBy: user.uid,
          reviewNotes: reviewNotes,
          updatedAt: now,
          approvalStartDate: now,
          approvalEndDate: approvalEndDate,
          approvalDuration: approvalDuration
        } : req
      );
      
      setRequests(updatedRequests);
      filterRequests(updatedRequests, activeTab, searchQuery);
      
      toast({
        title: 'Request Approved',
        description: `Premium access granted to user for ${approvalDuration} days.`
      });
      
      setReviewDialogOpen(false);
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve the request.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle request rejection
  const handleRejectRequest = async () => {
    if (!selectedRequest || !user) return;
    
    try {
      setIsProcessing(true);
      
      const now = Date.now();
      
      // Update the request in Firestore
      await updateDoc(doc(db, 'premiumRequests', selectedRequest.id!), {
        status: 'rejected',
        reviewedBy: user.uid,
        reviewNotes: reviewNotes,
        updatedAt: now
      });
      
      // Update local state
      const updatedRequests = requests.map(req => 
        req.id === selectedRequest.id ? {
          ...req,
          status: 'rejected',
          reviewedBy: user.uid,
          reviewNotes: reviewNotes,
          updatedAt: now
        } : req
      );
      
      setRequests(updatedRequests);
      filterRequests(updatedRequests, activeTab, searchQuery);
      
      toast({
        title: 'Request Rejected',
        description: 'Premium access request has been rejected.'
      });
      
      setReviewDialogOpen(false);
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject the request.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Premium Access Requests</CardTitle>
        <CardDescription>
          Manage requests from users who want to try premium features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email or feature..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {loading ? (
            <div className="text-center py-4">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No {activeTab} requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.userName || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                    </TableCell>
                    <TableCell>{request.requestedFeature}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openReviewDialog(request)}
                      >
                        {request.status === 'pending' ? 'Review' : 'Details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
      
      {/* Request Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === 'pending' ? 'Review Premium Access Request' : 'Premium Access Request Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.status === 'pending' 
                ? 'Review this request and decide whether to grant temporary premium access.'
                : 'View details of this premium access request.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label className="text-muted-foreground">User Name</Label>
                  <div>{selectedRequest.userName || 'Unknown'}</div>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-muted-foreground">User Email</Label>
                  <div>{selectedRequest.userEmail}</div>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="font-mono text-xs">{selectedRequest.userId}</div>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Requested Feature</Label>
                  <div>{selectedRequest.requestedFeature}</div>
                </div>
                
                <div className="col-span-4">
                  <Label className="text-muted-foreground">Request Message</Label>
                  <div>{selectedRequest.requestMessage || 'No message provided'}</div>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Date Requested</Label>
                  <div>{formatDate(selectedRequest.createdAt)}</div>
                </div>
                
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                
                {selectedRequest.status !== 'pending' && (
                  <>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Reviewed By</Label>
                      <div>{selectedRequest.reviewedBy || 'Unknown'}</div>
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Review Date</Label>
                      <div>{selectedRequest.updatedAt ? formatDate(selectedRequest.updatedAt) : 'Unknown'}</div>
                    </div>
                    
                    {selectedRequest.status === 'approved' && (
                      <>
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Access Duration</Label>
                          <div>{selectedRequest.approvalDuration || 0} days</div>
                        </div>
                        
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Expiry Date</Label>
                          <div>{selectedRequest.approvalEndDate ? formatDate(selectedRequest.approvalEndDate) : 'Unknown'}</div>
                        </div>
                      </>
                    )}
                  </>
                )}
                
                <div className="col-span-4">
                  <Label className="text-muted-foreground">Review Notes</Label>
                  {selectedRequest.status === 'pending' ? (
                    <Textarea
                      placeholder="Add notes about this request..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="mt-2"
                    />
                  ) : (
                    <div>{selectedRequest.reviewNotes || 'No review notes'}</div>
                  )}
                </div>
              </div>
              
              {selectedRequest.status === 'pending' && (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="approvalDuration">Approval Duration (days)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="approvalDuration"
                        type="number"
                        min={1}
                        max={365}
                        value={approvalDuration}
                        onChange={(e) => setApprovalDuration(parseInt(e.target.value) || 7)}
                        className="w-24"
                      />
                      <span>days</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {selectedRequest?.status === 'pending' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectRequest} disabled={isProcessing}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApproveRequest} disabled={isProcessing}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}