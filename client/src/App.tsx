import { Switch, Route, useLocation } from 'wouter';
import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from './lib/auth';
import { useTheme } from './hooks/use-theme';
import { useFontSize } from './hooks/use-font-size';
import { useEffect } from 'react';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/not-found';
import SnippetDetail from '@/pages/SnippetDetail';
import NoteDetail from '@/pages/NoteDetail';
import ChecklistDetail from '@/pages/ChecklistDetail';
import TagDetail from '@/pages/TagDetail';
import Projects from '@/pages/Projects';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/AdminDashboard';
import UserDetail from '@/pages/UserDetail';

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return user ? <Component /> : null;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(!!userData.isAdmin);
          if (!userData.isAdmin) {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    if (!isLoading) {
      checkAdminStatus();
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (user && isAdmin) ? <Component /> : null;
}

function Router() {
  // Remove the duplicate auth check here
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={() => <PrivateRoute component={Home} />} />
      <Route path="/settings" component={() => <PrivateRoute component={Settings} />} />
      <Route path="/projects" component={() => <PrivateRoute component={Projects} />} />
      <Route path="/profile" component={() => <PrivateRoute component={Profile} />} />
      <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/admin/users/:id" component={() => <AdminRoute component={UserDetail} />} />
      <Route path="/snippets/:id" component={() => <PrivateRoute component={SnippetDetail} />} />
      <Route path="/notes/:id" component={() => <PrivateRoute component={NoteDetail} />} />
      <Route path="/checklists/:id" component={() => <PrivateRoute component={ChecklistDetail} />} />
      <Route path="/tags/:tag" component={() => <PrivateRoute component={TagDetail} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize theme and font size after QueryClient is available
  useTheme();
  useFontSize();

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;