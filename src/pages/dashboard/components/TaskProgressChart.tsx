'use client';

import { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DropdownMenu from '@/components/ui/DropdownMenu';
import type { Project } from '@/lib/projects-data';

interface TaskProgressChartProps {
  projects?: Project[];
  loading?: boolean;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function getPeriodRange(period: string): { start: Date; end: Date } | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (period) {
    case 'This Month':
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0, 23, 59, 59, 999) };
    case 'Last Month':
      return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0, 23, 59, 59, 999) };
    case 'This Quarter': {
      const qStart = Math.floor(month / 3) * 3;
      return { start: new Date(year, qStart, 1), end: new Date(year, qStart + 3, 0, 23, 59, 59, 999) };
    }
    case 'This Year':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
    default:
      return null;
  }
}

function filterByPeriod(projects: Project[], period: string): Project[] {
  const range = getPeriodRange(period);
  if (!range) return projects;
  return projects.filter((p) => {
    const start = parseDate(p.startDate);
    const end = parseDate(p.dueDate);
    if (!start || !end) return true;
    return start <= range.end && end >= range.start;
  });
}

function computeWeeklyTaskData(projects: Project[], period: string): { completed: number[]; inProgress: number[] } {
  const filtered = filterByPeriod(projects, period);
  let totalCompleted = 0;
  let totalRemaining = 0;
  filtered.forEach((p) => {
    totalCompleted += p.tasksCompleted || 0;
    totalRemaining += Math.max(0, (p.totalTasks || 0) - (p.tasksCompleted || 0));
  });
  const completed: number[] = [];
  const inProgress: number[] = [];
  for (let i = 0; i < 4; i++) {
    const ratio = (i + 1) / 4;
    completed.push(Math.round(totalCompleted * ratio));
    inProgress.push(Math.round(totalRemaining * Math.max(0, 1 - ratio * 0.7)));
  }
  return { completed, inProgress: inProgress };
}

export default function TaskProgressChart({ projects = [], loading = false }: TaskProgressChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState('This Month');

  useEffect(() => {
    if (!chartRef.current) return;
    const { completed, inProgress } = computeWeeklyTaskData(projects, period);
    Highcharts.chart(chartRef.current, {
      chart: { type: 'line', height: 220, backgroundColor: 'transparent', animation: { duration: 300 }, style: { fontFamily: 'inherit' } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], labels: { style: { color: 'var(--muted-foreground)', fontSize: '11px' } }, lineColor: 'var(--border)', tickColor: 'var(--border)' },
      yAxis: { title: { text: '' }, labels: { style: { color: 'var(--muted-foreground)', fontSize: '11px' } }, gridLineColor: 'var(--border)', min: 0 },
      legend: { enabled: false },
      tooltip: { shared: true, backgroundColor: 'white', borderColor: 'var(--border)', borderRadius: 8, style: { color: 'var(--foreground)' } },
      plotOptions: { line: { lineWidth: 2, marker: { enabled: true, radius: 4, symbol: 'circle' } } },
      series: [
        { name: 'Completed', data: completed, color: '#10B981' },
        { name: 'In Progress', data: inProgress, color: '#3B82F6' },
      ],
    });
  }, [projects, period]);

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
