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
  iconType?: 'folder' | 'clock' | 'check' | 'alert' | 'users' | 'dollar' | 'trending';
  sparklineData?: number[];
  sparklineColor?: string;
  icon?: React.ReactNode;
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
}: StatCardClientProps) {
  return (
    <StatCard
      title={title}
      value={value}
      trend={trend}
      trendUp={trendUp}
      iconBg={iconBg}
      iconColor={iconColor}
      iconType={iconType}
      sparklineData={sparklineData}
      sparklineColor={sparklineColor}
      icon={icon}
    />
  );
});

export default StatCardClient;
