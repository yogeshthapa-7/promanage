'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Drawer from '@/components/drawer';
import Button from '@/components/ui/Button';
import { apiCall } from '@/lib/api';
import { LogOut, Mail, User, Building2, Shield } from 'lucide-react';

interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfileDrawer({ open, onClose }: UserProfileDrawerProps) {
  const { user, logout } = useAuth();
  const [employeeName, setEmployeeName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

  useEffect(() => {
    let cancelled = false;
    if (!open || !user?.employeeId) {
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmployeeName('');
        setDepartmentName('');
      }
      return;
    }

    const controller = new AbortController();
    setEmployeeLoading(true);

    apiCall(`${API_BASE}/EmployeeInfo/ServerSearch`, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 1,
          columns: [
            { data: 'EmployeeInfoID', name: 'EmployeeInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          ],
          search: { value: '', regex: '' },
          order: [{ column: 0, dir: 'desc' }],
        },
        param: {
          EmployeeInfoID: user.employeeId,
          Fullname: '',
          Address: '',
          Phone: '',
          DepartmentID: user.departmentCode || 0,
          DepartmentName: '',
          DOB: '',
          Email: '',
          Gender: 0,
          Password: '',
          Username: '',
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        const emp = data[0];
        if (emp) {
          setEmployeeName(emp.Fullname || '');
          setDepartmentName(emp.DepartmentName || '');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setEmployeeLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, user?.employeeId, user?.departmentCode, API_BASE]);

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

        {employeeName && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <User size={16} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Employee Name</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{employeeName}{employeeLoading && ' (loading…)'}</p>
            </div>
          </div>
        )}

        {departmentName && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Department</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{departmentName}</p>
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
