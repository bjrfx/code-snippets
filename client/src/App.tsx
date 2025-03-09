import { Switch, Route, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from './lib/auth';
import { useTheme } from './hooks/use-theme';
import { useEffect } from 'react';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/not-found';
import SnippetDetail from '@/pages/SnippetDetail';
import NoteDetail from '@/pages/NoteDetail';
import ChecklistDetail from '@/pages/ChecklistDetail';
import TagDetail from '@/pages/TagDetail';

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

function Router() {
  // Remove the duplicate auth check here
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={() => <PrivateRoute component={Home} />} />
      <Route path="/settings" component={() => <PrivateRoute component={Settings} />} />
      <Route path="/snippets/:id" component={() => <PrivateRoute component={SnippetDetail} />} />
      <Route path="/notes/:id" component={() => <PrivateRoute component={NoteDetail} />} />
      <Route path="/checklists/:id" component={() => <PrivateRoute component={ChecklistDetail} />} />
      <Route path="/tags/:tag" component={() => <PrivateRoute component={TagDetail} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize theme after QueryClient is available
  useTheme();

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;