import { FC, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavBar } from './MobileNavBar';
import { AIBar } from '@/components/ai/AIBar';
import { useUserRole } from '@/hooks/use-user-role';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { isPaid } = useUserRole();
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Main content - adjust padding for mobile and add margin for sidebar */}
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 md:ml-64 transition-all duration-200">
        {children}
      </main>
      {/* Mobile navigation bar - only visible on mobile */}
      <MobileNavBar />
      {isPaid && <AIBar />}
    </div>
  );
};
