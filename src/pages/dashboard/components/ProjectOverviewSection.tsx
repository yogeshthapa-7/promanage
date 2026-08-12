import { useEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DropdownMenu from '@/components/ui/DropdownMenu';
import type { Project } from '@/lib/projects-data';

interface ProjectOverviewSectionProps {
  projects: Project[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'In Progress': '#3B82F6',
  Completed: '#10B981',
  'On Hold': '#F59E0B',
  Overdue: '#EF4444',
  'Not Started': '#9CA3AF',
};

export default function ProjectOverviewSection({ projects, loading = false }: ProjectOverviewSectionProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState('This Month');

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    const total = projects.length || 1;
    return Object.entries(counts).map(([label, count]) => ({
      id: `overview-${label.toLowerCase().replace(/\s+/g, '-')}`,
      label,
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
      color: STATUS_COLORS[label] || '#9CA3AF',
    }));
  }, [projects]);

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
  }, [statusBreakdown]);

  const periods = ['This Month', 'Last Month', 'This Quarter', 'This Year'];

  return (
     <Card className="h-full relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">Project Overview</h2>
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

      <div className="flex items-center gap-4">
        <div ref={chartRef} style={{ width: 160, height: 160, flexShrink: 0 }} />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {statusBreakdown.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-sm text-foreground truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
               <span className="text-xs font-semibold tabular-nums text-foreground">{item.count}</span>
               <span className="text-xs tabular-nums w-10 text-right" style={{ color: 'var(--muted-foreground)' }}>{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50">
        <p className="text-sm italic leading-relaxed text-center" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.01em', lineHeight: '1.6', maxWidth: '90%', margin: '0 auto' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 500, fontStyle: 'normal' }}>Project distribution</span>
          {' '}— {projects.length} active projects tracked across {statusBreakdown.length} status categories.
          <span className="block mt-1" style={{ fontSize: '0.85em', opacity: 0.75 }}>
            {statusBreakdown.length > 0
              ? `${statusBreakdown[0]?.label || 'None'} projects lead at ${statusBreakdown[0]?.percentage || 0}%.`
              : 'No project data available.'}
          </span>
        </p>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
          <p className="text-xs text-muted-foreground">Loading overview...</p>
        </div>
      )}
    </Card>
  );
}
