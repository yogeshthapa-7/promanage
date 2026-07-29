import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DashboardBackground from '@/pages/dashboard/DashboardBackground';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  background?: React.ReactNode;
  showTopbar?: boolean;
}

export default function AppLayout({
  children,
  pageTitle = 'Dashboard',
  pageSubtitle = 'Welcome back To Project Management Dashboard! 👋',
  background,
  showTopbar = true,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        {background !== undefined ? background : <DashboardBackground />}
      </div>

       <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
       <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-[1]">
         {showTopbar && <Topbar pageTitle={pageTitle} pageSubtitle={pageSubtitle} />}
         <main className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}