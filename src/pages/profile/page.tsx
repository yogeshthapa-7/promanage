'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Drawer from '@/components/drawer';
import Button from '@/components/ui/Button';
import { LogOut, Mail, User, Hash, Building2, Shield } from 'lucide-react';

interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfileDrawer({ open, onClose }: UserProfileDrawerProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Profile" width={420}>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4">
          {user?.name ? user.name.charAt(0).toUpperCase() : <User size={32} />}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User'}</h2>
        <p className="text-sm text-slate-500 mt-1">{user?.email || ''}</p>
        <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {user?.role === 'admin' ? 'Administrator' : 'User'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Mail size={16} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Email</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.email || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <User size={16} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Username</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.userName || user?.name || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Shield size={16} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Role</p>
            <p className="text-sm font-semibold text-slate-800">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
          </div>
        </div>

        {user?.employeeId && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Hash size={16} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Employee ID</p>
              <p className="text-sm font-semibold text-slate-800">{user.employeeId}</p>
            </div>
          </div>
        )}

        {user?.departmentCode && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Department Code</p>
              <p className="text-sm font-semibold text-slate-800">{user.departmentCode}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button danger block onClick={handleLogout} icon={<LogOut size={16} />}>
          Sign Out
        </Button>
      </div>
    </Drawer>
  );
}
