'use client';

import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import Card from '@/components/ui/Card';
import type { Project } from '@/lib/projects-data';

interface TaskProgressChartProps {
  projects?: Project[];
  loading?: boolean;
}

function computeTaskStatusData(projects: Project[]): { name: string; count: number; color: string }[] {
  const totals: Record<string, number> = {};
  projects.forEach((p) => {
    const byStatus = p.taskStatusCounts || {};
    Object.entries(byStatus).forEach(([status, count]) => {
      totals[status] = (totals[status] || 0) + count;
    });
  });

  const STATUS_COLORS: Record<string, string> = {
    'Completed': '#10B981',
    'In Progress': '#3B82F6',
    'In Progress Final': '#6366F1',
    'Not Started': '#9CA3AF',
    'On Hold': '#F59E0B',
    'Overdue': '#EF4444',
  };

  return Object.entries(totals)
    .map(([name, count]) => ({
      name,
      count,
      color: STATUS_COLORS[name] || '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count);
}

export default function TaskProgressChart({ projects = [], loading = false }: TaskProgressChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const statusData = computeTaskStatusData(projects);
    Highcharts.chart(chartRef.current, {
      chart: { type: 'column', height: 220, backgroundColor: 'transparent', animation: { duration: 300 }, style: { fontFamily: 'inherit' } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: { categories: ['All Projects'], labels: { style: { color: 'var(--muted-foreground)', fontSize: '11px' } }, lineColor: 'var(--border)', tickColor: 'var(--border)' },
      yAxis: { title: { text: '' }, labels: { style: { color: 'var(--muted-foreground)', fontSize: '11px' } }, gridLineColor: 'var(--border)', min: 0, allowDecimals: false },
      legend: { enabled: true, itemStyle: { color: 'var(--muted-foreground)', fontSize: '11px' } },
      tooltip: { shared: true, backgroundColor: 'white', borderColor: 'var(--border)', borderRadius: 8, style: { color: 'var(--foreground)' } },
      plotOptions: { column: { stacking: 'normal', borderRadius: 4, borderWidth: 0, pointWidth: 70 } },
      series: statusData.map((s) => ({
        name: s.name,
        data: [s.count],
        color: s.color,
      })),
    });
  }, [projects]);

  return (
     <Card className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 className="text-sm font-bold text-foreground">Task Progress</h2>
        </div>

       <div ref={chartRef} style={{ width: '100%', flex: 1, minHeight: 220 }} />

       {loading && (
         <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
           <p className="text-xs text-muted-foreground">Loading chart...</p>
         </div>
       )}
    </Card>
  );
}
