'use client';

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChartLine,
  Building,
  Building2,
} from 'lucide-react';
import { User } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard'},
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} />, href: '/projects'},
  { id: 'tasks', label: 'Task', icon: <CheckSquare size={18} />, href: '/tasks' },
  { id: 'analytics', label: 'Analytics', icon: <ChartLine size={18} />, href: '/analytics' },
  { id: 'team-members', label: 'Team Members', icon: <Users size={18} />, href: '/team', section: 'TEAM' },
  { id: 'users', label: 'Users', icon: <Users size={18} />, href: '/users', section: 'TEAM' },
  { id: 'employee', label: 'Employee', icon: <User size={18} />, href: '/employee', section: 'TEAM' },
  { id: 'departments', label: 'department', icon: <Building size={18} />, href: '/departments', section: 'TEAM' },
  { id: 'organizations', label: 'Organization', icon: <Building2 size={18} />, href: '/Organizations', section: 'TEAM' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

function getActiveNavId(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/projects': 'projects',
    '/tasks': 'tasks',
    '/analytics': 'analytics',
    '/team': 'team-members',
    '/users': 'users',
    '/employee':'employee',
    '/departments':'departments',
    '/organizations':'organizations',
  };
  return map[pathname] ?? 'dashboard';
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = getActiveNavId(location.pathname);
  const mainNav = navItems.filter((item) => !item.section);
  const teamNav = navItems.filter((item) => item.section === 'TEAM');

  return (
    <aside
      className="sidebar-transition flex flex-col h-screen flex-shrink-0 overflow-hidden relative z-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        width: collapsed ? '78px' : '270px',
        background: 'linear-gradient(to bottom, #0f172a, #1e1b4b)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(229, 231, 235, 0.5)',
        borderRadius: '0',
        boxShadow: '4px 0 40px rgba(124, 58, 237, 0.06), 4px 0 80px rgba(99, 102, 241, 0.03)',
      }}
    >
      {/* App Header Logo Container */}
      <div className="flex items-center h-[90px] px-5 flex-shrink-0 border-b border-gray-100/50">
        <div className="flex items-center gap-3 min-w-0 w-full">
          <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center relative overflow-visible">
            <img src="/assets/images/logo.png" alt="ProManage" className="h-full w-full object-contain scale-[1.6] transition-transform duration-200" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent tracking-tight truncate">ProManage</span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase truncate">Project Tracking System</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 flex flex-col gap-1.5">
        {mainNav.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Link
              key={item.id}
              to={item.href}
              title={item.label}
              className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-xs transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-purple-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
              }`}
            >
              {/* Active Indicator Pillar */}
              {isActive && (
                <span className="absolute -left-3 top-2.5 bottom-2.5 w-1.5 bg-gradient-to-b from-[#7C3AED] to-[#6366F1] rounded-r-full" />
              )}

              <span
                className={`flex-shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isActive ? 'scale-110 text-white' : 'group-hover:scale-110 text-slate-300 group-hover:text-white'
                }`}
              >
                {item.icon}
              </span>

              {!collapsed && <span className="flex-1 truncate tracking-tight">{item.label}</span>}

              
            </Link>
          );
        })}

        {/* Section Divider */}
        {!collapsed ? (
          <div className="pt-4 pb-1 px-3.5">
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-gray-200">
              Team
            </p>
          </div>
        ) : (
          <div className="my-2 border-t border-gray-200/50" />
        )}

        {/* Team Sub-Navigation */}
        {teamNav.map((item) => {
          const isActive = activeId === item.id;
          return (
            <Link
              key={item.id}
              to={item.href}
              title={item.label}
              className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-xs transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-purple-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
              }`}
            >
              {isActive && (
                <span className="absolute -left-3 top-2.5 bottom-2.5 w-1.5 bg-gradient-to-b from-[#7C3AED] to-[#6366F1] rounded-r-full" />
              )}

              <span
                className={`flex-shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isActive ? 'scale-110 text-white' : 'group-hover:scale-110 text-slate-300 group-hover:text-white'
                }`}
              >
                {item.icon}
              </span>

              {!collapsed && <span className="flex-1 truncate tracking-tight">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="flex-shrink-0 px-3 pb-3">
        <button onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gray-900/20 border border-gray-700/50 text-slate-100 hover:text-rose-400 hover:bg-gray-900/30 hover:border-rose-400/30 transition-all duration-200 cursor-pointer">
          <LogOut size={18} />
          {!collapsed && <span className="text-xs font-semibold">Sign Out</span>}
        </button>
      </div>

      {/* Collapse / Expand Toggle Button Footer */}
      <div className="flex-shrink-0 px-3 pb-5 pt-3 border-t border-gray-100/50">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2.5 rounded-2xl bg-gray-900/20 border border-gray-700/50 text-slate-100 hover:text-primary hover:bg-gray-900/30 hover:border-primary/30 hover:shadow-sm shadow-xs transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
