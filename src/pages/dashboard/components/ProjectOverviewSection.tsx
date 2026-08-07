'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Highcharts from 'highcharts';
import Card from '@/components/ui/Card';

const statusBreakdown = [
  { id: 'overview-completed', label: 'Completed', count: 10, percentage: 41.7, color: '#10B981' },
  { id: 'overview-in-progress', label: 'In Progress', count: 8, percentage: 33.3, color: '#3B82F6' },
  { id: 'overview-on-hold', label: 'On Hold', count: 3, percentage: 12.5, color: '#F59E0B' },
  { id: 'overview-overdue', label: 'Overdue', count: 2, percentage: 8.3, color: '#EF4444' },
  { id: 'overview-not-started', label: 'Not Started', count: 1, percentage: 4.2, color: '#9CA3AF' },
];

export default function ProjectOverviewSection() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState('This Month');
  const [periodOpen, setPeriodOpen] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;
    Highcharts.chart(chartRef.current, {
      chart: { type: 'pie', height: 200, backgroundColor: 'transparent', animation: { duration: 300 }, styledMode: false },
      title: { text: '' },
      credits: { enabled: false },
      tooltip: { headerFormat: '', pointFormat: '<span style="color:{point.color}">●</span> <b>{point.name}</b><br/>Count: <b>{point.y}</b><br/>Share: <b>{point.percentage:.1f}%</b>' },
      plotOptions: { pie: { innerSize: '65%', borderWidth: 2, borderColor: '#FFFFFF', dataLabels: { enabled: false }, showInLegend: false, states: { hover: { halo: { size: 0 } } } } },
      series: [{ type: 'pie', name: 'Projects', data: statusBreakdown.map((s) => ({ name: s.label, y: s.count, color: s.color })) }],
    });
  }, []);

  const periods = ['This Month', 'Last Month', 'This Quarter', 'This Year'];

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Project Overview</h2>
        <div className="relative">
          <button onClick={() => setPeriodOpen(!periodOpen)} className="btn-ghost text-sm flex items-center gap-2 py-1.5 px-3">
            {period}
            <ChevronDown size={14} />
          </button>
          {periodOpen && (
            <div className="absolute right-0 top-full mt-1 bg-slate-50 border border-slate-200 rounded-xl py-1 z-10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)', minWidth: '120px' }}>
              {periods.map((p) => (
                <button key={`period-${p}`} onClick={() => { setPeriod(p); setPeriodOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-white hover:shadow-sm transition-colors" style={{ color: p === period ? 'var(--primary)' : 'var(--foreground)' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div ref={chartRef} style={{ width: 200, height: 200, flexShrink: 0 }} />
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {statusBreakdown.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-sm text-foreground truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold tabular-nums text-foreground">{item.count}</span>
                <span className="text-sm tabular-nums w-10 text-right" style={{ color: 'var(--muted-foreground)' }}>{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50">
        <p className="text-sm italic leading-relaxed text-center" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.01em', lineHeight: '1.6', maxWidth: '90%', margin: '0 auto' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 500, fontStyle: 'normal' }}>Project distribution</span>
          {' '}— 24 active projects tracked across 5 status categories.
          <span className="block mt-1" style={{ fontSize: '0.85em', opacity: 0.75 }}>Completed projects lead at 41.7%, with 33.3% currently in progress.</span>
        </p>
      </div>
    </Card>
  );
}