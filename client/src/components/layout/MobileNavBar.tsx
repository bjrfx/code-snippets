import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FolderClosed, Search, Settings, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/use-user-role';

export function MobileNavBar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/projects', icon: FolderClosed, label: 'Projects' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/profile', icon: UserCircle, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <div 
                className={cn(
                  "flex flex-col items-center justify-center w-full",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}