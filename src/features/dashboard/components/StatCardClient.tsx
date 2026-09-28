import { memo } from 'react';
import StatCard from '@/shared/components/ui/StatCard';
import type { StatCardCLientProps } from '@/features/dashboard/types/dashboard-types';

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






