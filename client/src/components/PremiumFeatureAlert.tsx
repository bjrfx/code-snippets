import { useUserRole } from '@/hooks/use-user-role';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { PremiumRequestDialog } from '@/components/dialogs/PremiumRequestDialog';

export function PremiumFeatureAlert() {
  const { isFree } = useUserRole();
  
  // Only show for free users
  if (!isFree) return null;
  
  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-800">
      <Sparkles className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-800 flex items-center gap-2">
        Try Premium Features
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          Unlock advanced features like unlimited snippets, AI-powered suggestions, and more.
          Request access to any premium feature you'd like to try!
        </div>
        <PremiumRequestDialog 
          trigger={
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap">
              <Sparkles className="h-4 w-4 mr-1" />
              Request Feature
            </Button>
          } 
        />
      </AlertDescription>
    </Alert>
  );
}