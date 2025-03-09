import { useState } from 'react';
import { colorThemes, gradientThemes, ThemeOption } from '@/lib/themes';
import { useTheme } from '@/hooks/use-theme';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'colors' | 'gradients'>('colors');

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue="colors" 
        className="w-full"
        onValueChange={(value) => setSelectedTab(value as 'colors' | 'gradients')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colors">Color Themes</TabsTrigger>
          <TabsTrigger value="gradients">Gradient Themes</TabsTrigger>
        </TabsList>
        <TabsContent value="colors" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {colorThemes.map((colorTheme) => (
              <ThemeCard
                key={colorTheme.id}
                themeOption={colorTheme}
                isSelected={theme === colorTheme.id}
                onClick={() => setTheme(colorTheme.id)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="gradients" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gradientThemes.map((gradientTheme) => (
              <ThemeCard
                key={gradientTheme.id}
                themeOption={gradientTheme}
                isSelected={theme === gradientTheme.id}
                onClick={() => setTheme(gradientTheme.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ThemeCardProps {
  themeOption: ThemeOption;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeCard({ themeOption, isSelected, onClick }: ThemeCardProps) {
  const { theme } = themeOption;
  
  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <div 
        className="h-24 w-full relative"
        style={{
          background: themeOption.type === 'gradient' 
            ? theme.preview.background 
            : theme.preview.background
        }}
      >
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Check className="h-8 w-8 text-white" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex space-x-2">
          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.preview.primary }} />
          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.preview.secondary }} />
          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
        </div>
      </div>
      <CardContent className="p-3">
        <div className="font-medium">{themeOption.name}</div>
        <div className="text-xs text-muted-foreground">{themeOption.description}</div>
      </CardContent>
    </Card>
  );
}