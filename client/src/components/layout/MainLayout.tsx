import { FC, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { AIBar } from '@/components/ai/AIBar';
import { useUserRole } from '@/hooks/use-user-role';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { isPaid } = useUserRole();
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
      {isPaid && <AIBar />}
    </div>
  );
};
