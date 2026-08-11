'use client';

import { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import {
  FolderKanban,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Download,
  RefreshCw,
} from 'lucide-react';
import { getAnalyticsData } from '@/lib/analytics-data';
import type { AnalyticsData } from '@/lib/analytics-data';
import { BlockSkeleton } from '@/components/ui/Loaders';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('This Quarter');
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const statusChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const budgetChartRef = useRef<HTMLDivElement>(null);
  const categoryChartRef = useRef<HTMLDivElement>(null);
  const priorityChartRef = useRef<HTMLDivElement>(null);
  const taskChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    getAnalyticsData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    if (!statusChartRef.current) return;
    const { statusBreakdown } = data;
    Highcharts.chart(statusChartRef.current, {
      chart: { type: 'pie', height: 280, backgroundColor: 'transparent', animation: { duration: 400 } },
      title: { text: '' },
      credits: { enabled: false },
      tooltip: {
        headerFormat: '',
        pointFormat: '<span style="color:{point.color}">●</span> <b>{point.name}</b><br/>Projects: <b>{point.y}</b><br/>Share: <b>{point.percentage:.1f}%</b>',
      },
      plotOptions: {
        pie: {
          innerSize: '62%',
          borderWidth: 2,
          borderColor: '#FFFFFF',
          dataLabels: { enabled: false },
          showInLegend: false,
          states: { hover: { halo: { size: 0 } } },
        },
      },
      series: [
        {
          type: 'pie',
          name: 'Projects',
          data: statusBreakdown.map((s) => ({ name: s.label, y: s.count, color: s.color })),
        },
      ],
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (!trendChartRef.current) return;
    const { timeline } = data;
    Highcharts.chart(trendChartRef.current, {
      chart: { type: 'area', height: 280, backgroundColor: 'transparent', animation: { duration: 400 } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: {
        categories: timeline.map((t) => t.month),
        labels: { style: { color: '#94A3B8', fontSize: '11px' } },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        labels: { style: { color: '#94A3B8', fontSize: '11px' }, format: '{value}' },
        gridLineColor: '#E2E8F0',
        gridLineWidth: 1,
      },
      tooltip: { shared: true, valueSuffix: ' projects' },
      plotOptions: {
        area: { stacking: 'normal', lineColor: '#FFFFFF', lineWidth: 2, marker: { enabled: false } },
      },
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'top',
        itemStyle: { color: '#475569', fontSize: '12px' },
      },
      series: [
        { name: 'Completed', data: timeline.map((t) => t.completed), color: '#10B981', fillOpacity: 0.15 },
        { name: 'In Progress', data: timeline.map((t) => t.inProgress), color: '#3B82F6', fillOpacity: 0.15 },
      ],
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (!budgetChartRef.current) return;
    const { budgetByCategory } = data;
    Highcharts.chart(budgetChartRef.current, {
      chart: { type: 'bar', height: 280, backgroundColor: 'transparent', animation: { duration: 400 } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: {
        categories: budgetByCategory.map((b) => b.label),
        labels: { style: { color: '#94A3B8', fontSize: '11px' } },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        labels: { style: { color: '#94A3B8', fontSize: '11px' }, format: '${value:,.0f}' },
        gridLineColor: '#E2E8F0',
        gridLineWidth: 1,
      },
      tooltip: { pointFormat: '<b>${point.y:,.0f}</b> budget allocated' },
      plotOptions: { bar: { borderRadius: 6, borderWidth: 0, pointWidth: 28 } },
      legend: { enabled: false },
      series: [{ name: 'Budget', data: budgetByCategory.map((b) => ({ y: b.budget, color: b.color })) }],
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (!categoryChartRef.current) return;
    const { categoryBreakdown } = data;
    Highcharts.chart(categoryChartRef.current, {
      chart: { type: 'bar', height: 280, backgroundColor: 'transparent', animation: { duration: 400 } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: {
        categories: categoryBreakdown.map((c) => c.label),
        labels: { style: { color: '#94A3B8', fontSize: '11px' } },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        allowDecimals: false,
        labels: { style: { color: '#94A3B8', fontSize: '11px' } },
        gridLineColor: '#E2E8F0',
        gridLineWidth: 1,
        title: { text: 'Number of Projects' },
      },
      tooltip: { pointFormat: '<b>{point.y}</b> project(s)' },
      plotOptions: { bar: { borderRadius: 6, borderWidth: 0, pointWidth: 28 } },
      legend: { enabled: false },
      series: [{ name: 'Projects', data: categoryBreakdown.map((c) => ({ y: c.count, color: c.color })) }],
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (!priorityChartRef.current) return;
    const { priorityBreakdown } = data;
    Highcharts.chart(priorityChartRef.current, {
      chart: { type: 'pie', height: 280, backgroundColor: 'transparent', animation: { duration: 400 } },
      title: { text: '' },
      credits: { enabled: false },
      tooltip: {
        headerFormat: '',
        pointFormat: '<span style="color:{point.color}">●</span> <b>{point.name}</b><br/>Projects: <b>{point.y}</b><br/>Share: <b>{point.percentage:.1f}%</b>',
      },
      plotOptions: {
        pie: {
          innerSize: '62%',
          borderWidth: 2,
          borderColor: '#FFFFFF',
          dataLabels: { enabled: false },
          showInLegend: false,
          states: { hover: { halo: { size: 0 } } },
        },
      },
      series: [
        {
          type: 'pie',
          name: 'Priority',
          data: priorityBreakdown.map((p) => ({ name: p.label, y: p.count, color: p.color })),
        },
      ],
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (!taskChartRef.current) return;
    const { taskCompletion } = data;
    Highcharts.chart(taskChartRef.current, {
      chart: { type: 'bar', height: 280, backgroundColor: 'transparent', animation: { duration: 400 } },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: {
        categories: taskCompletion.map((t) => t.name),
        labels: { style: { color: '#94A3B8', fontSize: '10px' }, rotation: -20 },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        allowDecimals: false,
        labels: { style: { color: '#94A3B8', fontSize: '11px' } },
        gridLineColor: '#E2E8F0',
        gridLineWidth: 1,
        title: { text: 'Tasks' },
      },
      tooltip: { headerFormat: '<b>{point.key}</b><br/>', pointFormat: '{series.name}: <b>{point.y}</b> tasks' },
      plotOptions: { bar: { borderRadius: 6, borderWidth: 0, pointWidth: 22, stacking: 'normal' } },
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'top',
        itemStyle: { color: '#475569', fontSize: '12px' },
      },
      series: [
        { name: 'Completed', data: taskCompletion.map((t) => ({ y: t.completed, color: '#10B981' })) },
        { name: 'Remaining', data: taskCompletion.map((t) => ({ y: t.remaining, color: '#E2E8F0' })) },
      ],
    });
  }, [data]);

  const handleRefresh = () => {
    setRefreshing(true);
    getAnalyticsData().then((result) => {
      setData(result);
      setRefreshing(false);
    });
  };

  if (!data) {
    return (
      <div className="fade-in text-slate-800 flex items-center justify-center h-96">
        <BlockSkeleton lines={4} className="w-full max-w-md" message="Loading analytics data..." />
      </div>
    );
  }

  const {
    kpis,
    statusBreakdown,
    priorityBreakdown,
    categoryBreakdown,
    budgetByCategory,
    timelineSummary,
    keyMetrics,
    totalBudget,
    totalTasksCompleted,
    totalTasks,
    taskCompletionRate,
  } = data;

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
          <p className="mt-1 text-base text-slate-500">
            Comprehensive project performance overview, budget tracking, and delivery metrics for ProManage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
          </select>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-sm">
            <Download className="h-4 w-4" strokeWidth={2.5} />
            Export
          </button>
        </div>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.slice(0, 4).map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-4 border border-slate-200/60 transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600">
                <FolderKanban className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500">{c.label}</div>
                <div className="text-2xl font-bold leading-tight text-slate-800">{c.value}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-base text-slate-400">{c.description}</div>
              <div className="flex items-center gap-1 text-sm">
                {c.up ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className={c.up ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-500'}>
                  {c.change}
                </span>
                <span className="text-slate-400">vs prev</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.slice(4).map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-4 border border-slate-200/60 transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600">
                <FolderKanban className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500">{c.label}</div>
                <div className="text-2xl font-bold leading-tight text-slate-800">{c.value}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-base text-slate-400">{c.description}</div>
              <div className="flex items-center gap-1 text-sm">
                {c.up ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className={c.up ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-500'}>
                  {c.change}
                </span>
                <span className="text-slate-400">vs prev</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Project Status Breakdown</h3>
              <p className="mt-0.5 text-base text-slate-400">Distribution of projects by current status</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">
              <PieChart className="h-3 w-3" /> {kpis[0]?.value} Total
            </span>
          </div>
          <div ref={statusChartRef} className="w-full flex justify-center" />
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
            {statusBreakdown.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-600">{s.label}</span>
                <span className="font-bold text-slate-800">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Insight:</strong> {kpis[2]?.value} projects have been completed successfully. {kpis[3]?.value} project{kpis[3]?.value !== 1 ? 's are' : ' is'} currently overdue and requires immediate attention. {kpis[1]?.value} projects are actively in progress.
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Project Progress Trend</h3>
              <p className="mt-0.5 text-base text-slate-400">Completed vs in-progress projects over the last 7 months</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <TrendingUp className="h-3 w-3" /> +22% Growth
            </span>
          </div>
          <div ref={trendChartRef} className="w-full" />
          <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Trend Analysis:</strong> Completed projects have steadily increased from January through July. The in-progress pipeline shows consistent growth, indicating healthy project initiation rates. Q3 is expected to see the highest delivery volume.
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Budget by Category</h3>
              <p className="mt-0.5 text-base text-slate-400">Total budget allocation across project categories</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              <DollarSign className="h-3 w-3" /> ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div ref={budgetChartRef} className="w-full" />
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
            {budgetByCategory.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                <span className="text-slate-600">{b.label}</span>
                <span className="font-bold text-slate-800">${b.budget.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Budget Insight:</strong> Development projects consume the largest share of the budget, followed by Infrastructure. The average budget per project is <strong>${Math.round(totalBudget / (kpis[0]?.value as number)).toLocaleString()}</strong>.
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Projects by Category</h3>
              <p className="mt-0.1 text-base text-slate-400">Number of projects grouped by category</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
              <BarChart3 className="h-3 w-3" /> {categoryBreakdown.length} Categories
            </span>
          </div>
          <div ref={categoryChartRef} className="w-full" />
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
            {categoryBreakdown.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-slate-600">{c.label}</span>
                <span className="font-bold text-slate-800">{c.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Category Insight:</strong> Development is the most active category with {categoryBreakdown.find((c) => c.label === 'Development')?.count || 0} projects. Infrastructure and Design follow with balanced allocations across the portfolio.
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Priority Distribution</h3>
              <p className="mt-0.5 text-base text-slate-400">Projects grouped by priority level</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
              <Target className="h-3 w-3" /> Urgent: {priorityBreakdown.find((p) => p.label === 'Urgent')?.count || 0}
            </span>
          </div>
          <div ref={priorityChartRef} className="w-full flex justify-center" />
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
            {priorityBreakdown.map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-slate-600">{p.label}</span>
                <span className="font-bold text-slate-800">{p.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Priority Insight:</strong> {priorityBreakdown.find((p) => p.label === 'Urgent')?.count || 0} urgent project(s) require immediate resource allocation. {priorityBreakdown.find((p) => p.label === 'High')?.count || 0} high-priority projects are in the active pipeline.
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Task Completion by Project</h3>
              <p className="mt-0.5 text-base text-slate-400">Top 6 projects by completion rate</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <Zap className="h-3 w-3" /> {taskCompletionRate}% Overall
            </span>
          </div>
          <div ref={taskChartRef} className="w-full" />
          <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Task Insight:</strong> {totalTasksCompleted} of {totalTasks} total tasks completed across all projects ({taskCompletionRate}% completion rate). Projects with 100% progress have all tasks closed.
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-violet-500" />
            <h3 className="text-base font-semibold text-slate-800">Timeline Summary</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-500">Active Projects</span>
              <span className="text-sm font-bold text-slate-800">{timelineSummary.activeProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-500">Avg Days to Completion</span>
              <span className="text-sm font-bold text-slate-800">{timelineSummary.avgDaysToCompletion} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-500">On-Time Delivery Rate</span>
              <span className="text-sm font-bold text-emerald-600">{timelineSummary.onTimeDeliveryRate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-500">Budget Utilization</span>
              <span className="text-sm font-bold text-slate-800">{timelineSummary.budgetUtilization}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-500">Team Utilization</span>
              <span className="text-sm font-bold text-slate-800">{timelineSummary.teamUtilization}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            The project portfolio is operating at {timelineSummary.teamUtilization} team utilization with a {timelineSummary.onTimeDeliveryRate} on-time delivery rate. Budget utilization is at {timelineSummary.budgetUtilization}, leaving room for new project intake.
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-800">Status Distribution</h3>
          </div>
          <div className="flex flex-col gap-3">
            {statusBreakdown.map((s) => {
              const pct = (kpis[0]?.value as number) > 0 ? ((s.count / (kpis[0]?.value as number)) * 100).toFixed(1) : '0.0';
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{s.label}</span>
                    <span className="font-bold text-slate-800">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Summary:</strong> {kpis[2]?.value} completed projects represent the largest completed batch. {kpis[3]?.value} overdue project{kpis[3]?.value !== 1 ? 's need' : ' needs'} immediate resolution to prevent further delays.
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-800">Key Metrics</h3>
          </div>
          <div className="flex flex-col gap-3">
            {keyMetrics.map((m) => (
              <div key={m.title} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                <div className="text-base text-slate-500 font-medium">{m.title}</div>
                <div className={`text-lg font-bold text-slate-800 mt-0.5 ${m.color}`}>{m.value}</div>
                <div className="text-base text-slate-400 mt-1">{m.subtitle}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
            <strong>Performance:</strong> The portfolio is tracking ahead of schedule with a {timelineSummary.onTimeDeliveryRate} on-time delivery rate. Budget efficiency is strong at the current cost-per-task ratio.
          </div>
        </div>
      </div>
    </div>
  );
}