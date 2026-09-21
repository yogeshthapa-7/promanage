import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        {background !== undefined ? background : <DashboardBackground />}
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-[1]">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-foreground hover:bg-slate-50 transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/assets/images/logo.png" alt="ProManage" className="h-7 w-7 object-contain" />
            <span className="text-sm font-bold text-slate-800">ProManage</span>
          </div>
        </div>

        {showTopbar && (
          <Topbar
            pageTitle={pageTitle}
            pageSubtitle={pageSubtitle}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 sm:px-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}