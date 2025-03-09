import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [fontSize, setFontSize] = useState(14);

  const handleFontSizeChange = async (value: number[]) => {
    try {
      setFontSize(value[0]);
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          'settings.fontSize': value[0]
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update font size. Please try again.'
      });
    }
  };

  const handleThemeChange = async (checked: boolean) => {
    try {
      const newTheme = checked ? 'dark' : 'light';
      await setTheme(newTheme);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update theme. Please try again.'
      });
    }
  };

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
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
              />
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