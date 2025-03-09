import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { allThemes, getThemeById, ThemeOption } from '@/lib/themes';

type Theme = string; // Theme ID from themes.ts

export function useTheme() {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'default';
    }
    return 'default';
  });

  // Apply theme to document
  const applyTheme = (themeId: Theme) => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    allThemes.forEach(t => root.classList.remove(t.id));
    
    // Handle system theme preference
    const themeToApply = themeId === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'
      : themeId;
    
    // Add the theme class
    root.classList.add(themeToApply);
    
    // Apply CSS variables
    const selectedTheme = getThemeById(themeToApply);
    if (selectedTheme) {
      // Apply gradient background if it's a gradient theme
      if (selectedTheme.type === 'gradient') {
        root.style.setProperty('--gradient-background', selectedTheme.theme.preview.background);
      }
      
      // Apply all theme variables
      Object.entries(selectedTheme.theme.variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  };

  // Load theme from Firestore on auth change
  useEffect(() => {
    const loadUserTheme = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.settings?.theme) {
            setThemeState(userData.settings.theme);
            applyTheme(userData.settings.theme);
          }
        }
      }
    };
    loadUserTheme();
  }, [user]);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);

    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.theme': newTheme
      });
    }
  };

  return { theme, setTheme };
}