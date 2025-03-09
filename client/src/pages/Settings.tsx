import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useFontSize } from '@/hooks/use-font-size';
import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ui/theme-selector';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFontSizeChange = (value: number[]) => {
    try {
      // This will update the font size in real-time and save to Firebase
      setFontSize(value[0]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update font size. Please try again.'
      });
    }
  };

  // Theme is now handled directly by the ThemeSelector component
  // which calls setTheme from the useTheme hook

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Theme</Label>
              <ThemeSelector />
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Slider
                value={[fontSize]}
                max={20}
                min={12}
                step={1}
                className="w-full"
                onValueChange={handleFontSizeChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}