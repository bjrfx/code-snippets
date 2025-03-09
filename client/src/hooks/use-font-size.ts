import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFontSize() {
  const { user } = useAuth();
  const [fontSize, setFontSizeState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('fontSize') || '14', 10);
    }
    return 14;
  });

  // Apply font size to document
  const applyFontSize = (size: number) => {
    const root = window.document.documentElement;
    root.style.setProperty('--font-size', `${size}px`);
  };

  // Load font size from Firestore on auth change
  useEffect(() => {
    const loadUserFontSize = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.settings?.fontSize) {
            setFontSizeState(userData.settings.fontSize);
            applyFontSize(userData.settings.fontSize);
          }
        }
      }
    };
    loadUserFontSize();
  }, [user]);

  // Apply font size whenever it changes
  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const setFontSize = async (newFontSize: number) => {
    setFontSizeState(newFontSize);
    localStorage.setItem('fontSize', newFontSize.toString());
    applyFontSize(newFontSize);

    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.fontSize': newFontSize
      });
    }
  };

  return { fontSize, setFontSize };
}