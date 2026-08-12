'use client';

import { memo, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from 'antd';
import Highcharts from 'highcharts';

type IconType = 'folder' | 'clock' | 'check' | 'alert' | 'users' | 'dollar' | 'trending' | 'user-square' | 'building-2' | 'folder-open';

interface StatCardProps {
  title: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
  iconBg?: string;
  iconColor?: string;
  iconType?: IconType;
  icon?: React.ReactNode;
  sparklineData?: number[];
  sparklineColor?: string;
}

const iconMap: Record<IconType, React.ReactNode> = {
  folder: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  clock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  alert: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  dollar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  trending: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  'user-square': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  'building-2': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  'folder-open': <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
};

const StatCard = memo(function StatCard({
  title,
  value,
  trend,
  trendUp,
  iconBg = '#F3F0FF',
  iconColor = '#7C3AED',
  iconType = 'folder',
  icon,
  sparklineData = [],
  sparklineColor = '#7C3AED',
}: StatCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || sparklineData.length === 0) return;
    Highcharts.chart(chartRef.current, {
      chart: { type: 'area', height: 48, width: 96, margin: [2, 0, 4, 0], backgroundColor: 'transparent', animation: { duration: 200 }, style: { fontFamily: 'inherit' } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: { visible: false },
      yAxis: { visible: false },
      legend: { enabled: false },
      tooltip: { enabled: false },
      accessibility: { enabled: false },
      plotOptions: { area: { marker: { enabled: false }, lineWidth: 1.5, states: { hover: { lineWidth: 1.5 } }, animation: { duration: 200 } } },
      series: [{ type: 'area', data: sparklineData, color: sparklineColor, fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, sparklineColor + '30'], [1, sparklineColor + '00']] }, lineWidth: 1.5, animation: { duration: 200 } }],
    });
  }, [sparklineData, sparklineColor]);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon ?? iconMap[iconType]}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1">
          {trendUp ? (
            <TrendingUp size={14} style={{ color: '#10B981' }} />
          ) : (
            <TrendingDown size={14} style={{ color: '#EF4444' }} />
          )}
          <span className="text-sm font-medium" style={{ color: trendUp ? '#10B981' : '#EF4444' }}>
            {trend}
          </span>
        </div>
        {sparklineData.length > 0 && (
          <div ref={chartRef} style={{ width: 96, height: 48, flexShrink: 0 }} />
        )}
      </div>
    </Card>
  );
});

export default StatCard;