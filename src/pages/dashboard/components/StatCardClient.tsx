'use client';

import { memo } from 'react';
import StatCard from '@/components/ui/StatCard';

interface StatCardClientProps {
  title: string;
  value: number;
  trend: string;
  trendUp: boolean;
  iconBg?: string;
  iconColor?: string;
  iconType?: 'folder' | 'clock' | 'check' | 'alert' | 'users' | 'dollar' | 'trending' | 'user-square' | 'building-2' | 'folder-open';
  sparklineData?: number[];
  sparklineColor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const StatCardClient = memo(function StatCardClient({
  title,
  value,
  trend,
  trendUp,
  iconBg = '#F3F0FF',
  iconColor = '#7C3AED',
  iconType = 'folder',
  sparklineData = [],
  sparklineColor = '#7C3AED',
  icon,
  loading = false,
}: StatCardClientProps) {
  return (
    <StatCard
      title={title}
      value={loading ? '—' : value}
      trend={loading ? '...' : trend}
      trendUp={trendUp}
      iconBg={iconBg}
      iconColor={iconColor}
      iconType={iconType}
      sparklineData={loading ? [] : sparklineData}
      sparklineColor={sparklineColor}
      icon={icon}
    />
  );
});

export default StatCardClient;
