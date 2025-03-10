import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

interface PremiumRequestDialogProps {
  trigger?: React.ReactNode;
}

export function PremiumRequestDialog({ trigger }: PremiumRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestedFeature, setRequestedFeature] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Create the premium feature request
      await addDoc(collection(db, 'premiumRequests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || '',
        requestedFeature,
        requestMessage,
        status: 'pending',
        createdAt: Date.now(),
      });
      
      toast({
        title: 'Request Submitted',
        description: 'Your premium feature request has been submitted. An admin will review it soon.',
      });
      
      // Reset form and close dialog
      setRequestedFeature('');
      setRequestMessage('');
      setOpen(false);
    } catch (error: any) {
      console.error('Error submitting premium request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit your request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Request Premium Feature
          </DialogTitle>
          <DialogDescription>
            Tell us which premium feature you'd like to try, and our admin team will review your request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feature">Feature Name</Label>
            <Input
              id="feature"
              placeholder="Which premium feature would you like?"
              value={requestedFeature}
              onChange={(e) => setRequestedFeature(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell us why you need this feature..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !requestedFeature}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}