'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import Card from '@/components/ui/Card';
import type { Project } from '@/lib/projects-data';

interface TaskProgressChartProps {
  projects?: Project[];
  loading?: boolean;
}

export default function TaskProgressChart({ projects = [], loading = false }: TaskProgressChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState('This Month');
  const [periodOpen, setPeriodOpen] = useState(false);

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
        <div className="relative">
          <button onClick={() => setPeriodOpen(!periodOpen)}           className="btn-ghost text-xs flex items-center gap-1.5 py-1 px-2.5">
            {period}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {periodOpen && (
            <div className="absolute right-0 top-full mt-1 bg-slate-50 border border-slate-200 rounded-xl py-1 z-10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)', minWidth: '120px' }}>
              {periods.map((p) => (
                <button key={`period-${p}`} onClick={() => { setPeriod(p); setPeriodOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-white hover:shadow-sm transition-colors" style={{ color: p === period ? 'var(--primary)' : 'var(--foreground)' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
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
