import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export async function signIn(email: string, password: string) {
  try {
    console.log('Attempting to sign in:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', result.user.uid);
    
    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    console.log('User document exists:', userDoc.exists());
    
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        createdAt: serverTimestamp(),
        isAdmin: false, // Default to non-admin user
        role: 'free', // Default role
        settings: {
          theme: 'light',
          fontSize: 14
        }
      });
      console.log('Created new user document');
    }
    
    // Force navigation to home page
    window.location.href = '/';
    
    return result.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message);
  }
}

export async function signUp(email: string, password: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      createdAt: serverTimestamp(),
      isAdmin: false, // Default to non-admin user
      role: 'free', // Default role for new users
      settings: {
        theme: 'light',
        fontSize: 14
      }
    });
    return result.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth'],
    queryFn: () => new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe(); // Unsubscribe after first response
        resolve(user);
      });
    }),
    staleTime: Infinity, // Don't refetch unless explicitly invalidated
  });

  return { user, isLoading, isAuthenticated: !!user };
}