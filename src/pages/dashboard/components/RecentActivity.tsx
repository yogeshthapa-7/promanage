'use client';

import React, { memo } from 'react';
import { FolderPlus, CheckCircle2, MessageSquare, Upload, UserPlus, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}

const activities: ActivityItem[] = [
  { id: 'act-001', icon: <FolderPlus size={14} />, iconBg: '#F3F0FF', iconColor: '#7C3AED', title: 'New project "Data Centre Migration" created', subtitle: 'Kathmandu Shikshalaya', time: '2h ago' },
  { id: 'act-002', icon: <CheckCircle2 size={14} />, iconBg: '#ECFDF5', iconColor: '#10B981', title: 'Task "UI/UX Design" completed', subtitle: 'Anisha Gurung', time: '5h ago' },
  { id: 'act-003', icon: <MessageSquare size={14} />, iconBg: '#EFF6FF', iconColor: '#3B82F6', title: 'New comment on "Mobile App Development"', subtitle: 'Prabin Thapa', time: '1d ago' },
  { id: 'act-004', icon: <Upload size={14} />, iconBg: '#FFFBEB', iconColor: '#D97706', title: 'File "Project Proposal.pdf" uploaded', subtitle: 'Sagar Tamang', time: '2d ago' },
  { id: 'act-005', icon: <UserPlus size={14} />, iconBg: '#F3F0FF', iconColor: '#8B5CF6', title: 'Rajan Shrestha added to Security Audit', subtitle: 'Kathmandu Shikshalaya', time: '2d ago' },
  { id: 'act-006', icon: <AlertTriangle size={14} />, iconBg: '#FEF2F2', iconColor: '#EF4444', title: 'Marketing Campaign is now overdue', subtitle: 'Deadline passed Jun 30, 2025', time: '3d ago' },
];

const ActivityRow = memo(function ActivityRow({ item, index }: { item: ActivityItem; index: number }) {
  return (
    <div key={item.id} className="flex gap-3.5 relative group">
      {index < activities.length - 1 && (
        <div className="absolute left-[19px] top-10 bottom-[-20px] w-px bg-gray-100" />
      )}
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-transform duration-200 group-hover:scale-110" style={{ background: item.iconBg, color: item.iconColor }}>
        {item.icon}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base text-muted-foreground">{item.subtitle}</span>
          <span className="text-sm" style={{ color: 'var(--border)' }}>•</span>
          <span className="text-base text-muted-foreground">{item.time}</span>
        </div>
      </div>
    </div>
  );
});

export default memo(function RecentActivity() {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
        <a href="/activity" className="text-sm font-semibold transition-colors duration-150 hover:opacity-80" style={{ color: 'var(--primary)' }}>
          View All
        </a>
      </div>

      <div className="flex flex-col gap-5 flex-1 overflow-y-auto scrollbar-thin -mr-2 pr-2">
        {activities.map((item, index) => (
          <ActivityRow key={item.id} item={item} index={index} />
        ))}
      </div>
    </Card>
  );
});