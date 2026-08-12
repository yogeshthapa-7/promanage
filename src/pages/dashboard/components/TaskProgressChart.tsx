'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DropdownMenu from '@/components/ui/DropdownMenu';
import type { Project } from '@/lib/projects-data';

interface TaskProgressChartProps {
  projects?: Project[];
  loading?: boolean;
}

export default function TaskProgressChart({ projects = [], loading = false }: TaskProgressChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState('This Month');

  const completedTasks = useMemo(() => projects.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0), [projects]);
  const inProgressTasks = useMemo(() => projects.reduce((sum, p) => sum + Math.max(0, (p.totalTasks || 0) - (p.tasksCompleted || 0)), 0), [projects]);

  useEffect(() => {
    if (!chartRef.current) return;
    Highcharts.chart(chartRef.current, {
      chart: { type: 'line', height: 220, backgroundColor: 'transparent', animation: { duration: 300 }, style: { fontFamily: 'inherit' } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], labels: { style: { color: 'var(--muted-foreground)', fontSize: '11px' } }, lineColor: 'var(--border)', tickColor: 'var(--border)' },
      yAxis: { title: { text: '' }, labels: { style: { color: 'var(--muted-foreground)', fontSize: '11px' } }, gridLineColor: 'var(--border)', min: 0, max: 100 },
      legend: { enabled: false },
      tooltip: { shared: true, backgroundColor: 'white', borderColor: 'var(--border)', borderRadius: 8, style: { color: 'var(--foreground)' } },
      plotOptions: { line: { lineWidth: 2, marker: { enabled: true, radius: 4, symbol: 'circle' } } },
      series: [
        { name: 'Completed', data: [completedTasks, completedTasks, completedTasks, completedTasks], color: '#10B981' },
        { name: 'In Progress', data: [inProgressTasks, inProgressTasks, inProgressTasks, inProgressTasks], color: '#3B82F6' },
      ],
    });
  }, [completedTasks, inProgressTasks]);

  const periods = ['This Month', 'Last Month', 'This Quarter', 'This Year'];

  return (
     <Card className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-3 flex-shrink-0">
         <h2 className="text-sm font-bold text-foreground">Task Progress</h2>
         <DropdownMenu
           trigger={
             <Button size="small" className="text-xs flex items-center gap-1.5">
               {period}
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
             </Button>
           }
           items={periods.map((p) => ({
             label: p,
             onClick: () => setPeriod(p),
           }))}
         />
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
