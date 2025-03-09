import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'light';
    }
    return 'light';
  });

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    const themeToApply = newTheme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : newTheme;

    root.classList.add(themeToApply);
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