'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HighchartsReact } from 'highcharts-react-official';
import Highcharts from 'highcharts';
import {
  ArrowLeft,
  Pencil,
  Star,
  CheckCircle2,
  FileText,
  Flag,
  Clock,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { projects as fallbackProjects, type Project } from '@/lib/projects-data';

const statusClasses: Record<string, { bg: string; text: string; border: string }> = {
  'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  'Overdue': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  'On Hold': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  'Not Started': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const priorityClasses: Record<string, { bg: string; text: string; border: string }> = {
  'Urgent': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  'High': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  'Medium': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  'Low': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

// Budget Overview — Highcharts spline chart
const budgetOverviewOptions: Highcharts.Options = {
  chart: {
    type: 'spline',
    backgroundColor: 'transparent',
    height: 190,
    margin: [10, 10, 36, 10],
    style: { fontFamily: 'inherit' },
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: {
    enabled: true,
    align: 'left',
    verticalAlign: 'bottom',
    itemStyle: { fontSize: '11px', fontWeight: '500', color: '#94a3b8' },
    symbolHeight: 2,
    symbolWidth: 14,
    symbolRadius: 2,
    margin: 8,
  },
  xAxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    lineColor: '#f1f5f9',
    tickColor: 'transparent',
    labels: { style: { fontSize: '10px', color: '#94a3b8' } },
  },
  yAxis: {
    title: { text: undefined },
    gridLineColor: '#f1f5f9',
    labels: { enabled: false },
  },
  tooltip: {
    shared: true,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    shadow: false,
    style: { fontSize: '11px', color: '#334155' },
    valuePrefix: '$',
  },
  plotOptions: {
    spline: {
      lineWidth: 2.5,
      marker: { enabled: false, symbol: 'circle', radius: 4 },
      states: { hover: { lineWidth: 3 } },
    },
  },
  series: [
    {
      type: 'spline',
      name: 'Budget',
      color: '#7C3AED',
      data: [2000, 3500, 4800, 6000, 7200, 8500, 9800, 11000, 12500],
    },
    {
      type: 'spline',
      name: 'Actual',
      color: '#10B981',
      dashStyle: 'Dash',
      data: [1500, 2800, 4200, 5600, 7000, 8200, 9400, 10800, 12850],
    },
  ],
};

// Budget Summary — Highcharts donut chart
const budgetDonutOptions: Highcharts.Options = {
  chart: {
    type: 'pie',
    backgroundColor: 'transparent',
    height: 200,
    margin: [0, 0, 0, 0],
    style: { fontFamily: 'inherit' },
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: { enabled: false },
  tooltip: {
    pointFormat: '<b>{point.percentage:.0f}%</b> — ${point.y:,.0f}',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    shadow: false,
    style: { fontSize: '11px', color: '#334155' },
  },
  plotOptions: {
    pie: {
      innerSize: '65%',
      borderWidth: 0,
      dataLabels: { enabled: false },
      states: { hover: { halo: { size: 6 } } },
    },
  },
  series: [
    {
      type: 'pie',
      name: 'Budget',
      data: [
        { name: 'Spent', y: 12850, color: '#7C3AED' },
        { name: 'Remaining', y: 19150, color: '#10B981' },
        { name: 'Unallocated', y: 8500, color: '#e2e8f0' },
      ],
    },
  ],
};

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    let cancelled = false;
    const projectId = id;
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${(import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '')}/ProjectInfo/ServerSearch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 1000,
          columns: [
            { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: false } },
            { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: false } },
            { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: false } },
          ],
          search: { value: '', regex: false },
          order: [{ column: 0, dir: 'desc' }],
        },
        param: {
          ProjectInfoID: 0,
          ProjectName: '',
          ProjectCode: '',
          ProjectDuration: 0,
          StartDate: '',
          ClientInfoID: 0,
          ProjectHeadEmpID: 0,
          Description: '',
          Priority: 0,
          TotalBudget: 0,
          ClientInfoCode: '',
          WorkStatusID: 0,
          ProjectHeadEmpName: '',
          ProjectHeadEmpPhoto: '',
          WorkStatusName: '',
          WorkStatusColor: '',
          WorkStatusIcon: '',
          ProjectType: 0,
          ProjectTypeName: '',
          ExpenseInfoID: 0,
          Suchikrit_ServiceGroupTypeIDs: '',
          Suchikrit_ServiceTypeIDs: '',
          BudgetSourceID: 0,
          LastDateOfSubmission: '',
          TargetVendorIDs: '',
          ProjectOpenDate: '',
          Attachments: '',
          PriorityName: '',
          IsPolicyRelated: 0,
          PolicyProgramIDs: '',
          BudgetInfoIDs: '',
          BudgetInfoName: '',
          DepartmentName: '',
          DepartmentID: 0,
          ExpenseCode: '',
          WorkStatusCode: '',
          PublicAgentID: 0,
          Tippani: '',
          Samghauta: '',
          Kalyades: '',
          TOR: '',
          BankGuranteeIssueDate: '',
          BankGuranteeExpiryDate: '',
        },
      }),
      })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
        const json = await res.json();
        const projects = (json.data ?? []).filter((p: any) => String(p.ProjectInfoID) === projectId);
        return projects[0] ?? null;
      })
      .then((p) => {
        if (!cancelled) {
          if (p) {
            setProject(p);
          } else {
            const localProject = fallbackProjects.find((item) => item.id === projectId) ?? null;
            setProject(localProject);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const localProject = fallbackProjects.find((item) => item.id === projectId) ?? null;
          setProject(localProject);
          setError(localProject ? null : err instanceof Error ? err.message : 'Failed to load project');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{error ? `Error: ${error}` : 'Project not found.'}</p>
        </Card>
      </div>
    );
  }

  const projectTitle = project.title || project.name || 'Untitled Project';
  const Icon = project.icon;
  const statusStyle = statusClasses[project.status] || statusClasses['Not Started'];
  const priorityStyle = priorityClasses[project.priority] || priorityClasses['Medium'];

  const activities = [
    { id: 1, title: 'Task "UI Design" completed', user: 'Prabin Thapa', time: '2h ago', icon: CheckCircle2, iconBg: 'bg-emerald-100 text-emerald-600' },
    { id: 2, title: 'New file "Project-Plan.pdf" uploaded', user: 'Anisha Gurung', time: '1d ago', icon: FileText, iconBg: 'bg-amber-100 text-amber-600' },
    { id: 3, title: 'Milestone "Design Phase" completed', user: 'Sagar Tamang', time: '2d ago', icon: Flag, iconBg: 'bg-purple-100 text-purple-600' },
    { id: 4, title: 'Task "API Integration" in progress', user: 'Rita Shrestha', time: '3d ago', icon: Clock, iconBg: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <div className="fade-in space-y-5 max-w-screen-2xl mx-auto w-full pb-10">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <button
          onClick={() => navigate('/projects', { state: { editProjectId: project.id } })}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Project
        </button>
      </div>

      {/* ── Header Card ───────────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${project.iconBg} text-white shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground truncate">{projectTitle}</h1>
                {project.starred && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {project.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                  {project.priority} Priority
                </span>
                <span className="text-[11px] text-muted-foreground">{project.category}</span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-56 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="font-bold text-foreground">{project.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${project.progressColor} rounded-full transition-all duration-500`} style={{ width: `${project.progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{project.tasksCompleted} of {project.totalTasks} tasks</span>
              <span className="font-medium text-purple-600">{project.daysLeft}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Row 1: Project Information ────────────────────────────────── */}
      <Card className="p-6">
        <div className="pb-4 border-b border-border">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Project Information</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Core details and metadata about this project.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 mt-5 text-xs">
          {[
            { label: 'Project ID', value: project.id },
            { label: 'Category', value: project.category },
            { label: 'Client', value: project.client },
            { label: 'Start Date', value: project.startDate },
            { label: 'Submission Date', value: project.submissionDate },
            { label: 'Target End Date', value: project.targetEndDate },
          ].map((f) => (
            <div key={f.label}>
              <span className="text-muted-foreground block mb-1">{f.label}</span>
              <span className="font-semibold text-foreground">{f.value}</span>
            </div>
          ))}
          <div>
            <span className="text-muted-foreground block mb-1">Status</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
              {project.status}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Priority</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
              {project.priority}
            </span>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground block mb-1.5">Description</span>
          <p className="text-xs text-foreground/80 leading-relaxed">{project.description}</p>
        </div>
      </Card>

      {/* ── Row 2: Budget Overview | Budget Breakdown | Budget Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Budget Overview */}
        <Card className="p-6 flex flex-col">
          <div className="pb-4 border-b border-border shrink-0">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Budget Overview</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Monthly budget vs actual spend trend.</p>
          </div>
          <div className="flex-1 pt-2 -mx-2">
            <HighchartsReact highcharts={Highcharts} options={budgetOverviewOptions} />
          </div>
          <div className="mt-4 pt-4 border-t border-border shrink-0">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Insight: </span>
              Actual spending closely tracks the planned budget. A slight acceleration in Q3 suggests resource utilization is ramping up — review allocations if this trend continues.
            </p>
          </div>
        </Card>

        {/* Budget Breakdown */}
        <Card className="p-6 flex flex-col">
          <div className="pb-4 border-b border-border shrink-0">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Budget Breakdown</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Spending distribution across departments.</p>
          </div>
          <div className="space-y-4 mt-5 flex-1">
            {[
              { label: 'Design', color: 'bg-purple-600', spent: '$3,200', pct: '25%' },
              { label: 'Development', color: 'bg-indigo-600', spent: '$6,400', pct: '50%' },
              { label: 'Testing', color: 'bg-emerald-500', spent: '$1,850', pct: '14%' },
              { label: 'Marketing', color: 'bg-amber-500', spent: '$950', pct: '7%' },
              { label: 'Others', color: 'bg-slate-400', spent: '$450', pct: '4%' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                <span className="text-muted-foreground w-24 truncate">{item.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: item.pct }} />
                </div>
                <span className="text-[11px] font-semibold text-foreground w-14 text-right">{item.spent}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border shrink-0">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Insight: </span>
              Development dominates at 50% of spend. Design and Development together account for 75% of total budget — ensure these two areas stay on track to prevent overruns.
            </p>
          </div>
        </Card>

        {/* Budget Summary — Highcharts donut */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-start justify-between pb-4 border-b border-border shrink-0">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Budget Summary</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Allocation of total project budget.</p>
            </div>
            <button className="text-[11px] text-muted-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-muted/50 transition-colors shrink-0 mt-0.5">
              This Month
            </button>
          </div>

          {/* Donut chart */}
          <div className="relative flex items-center justify-center mt-2 -mx-2">
            <HighchartsReact highcharts={Highcharts} options={budgetDonutOptions} />
            {/* Centre label overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold text-foreground">{project.budget}</span>
              <span className="text-[10px] text-muted-foreground">Total Budget</span>
            </div>
          </div>

          {/* Legend rows */}
          <div className="space-y-2.5 text-[11px] mt-auto pt-3 border-t border-border">
            {[
              { dot: 'bg-purple-600', label: 'Spent', value: '$12,850', pct: '32%' },
              { dot: 'bg-emerald-500', label: 'Remaining', value: '$19,150', pct: '48%' },
              { dot: 'bg-slate-200', label: 'Unallocated', value: '$8,500', pct: '20%' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${row.dot}`} /> {row.label}
                </span>
                <span className="font-semibold text-foreground">
                  {row.value} <span className="text-muted-foreground font-normal">{row.pct}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border shrink-0">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Insight: </span>
              32% of the budget is spent with 48% still remaining. The 20% unallocated reserve gives room to absorb unexpected costs without exceeding the total project budget.
            </p>
          </div>
        </Card>

      </div>

      {/* ── Row 3: Project Team (8-col) | Key Dates (4-col) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Project Team */}
        <div className="lg:col-span-8 flex flex-col">
          <Card className="p-6 flex flex-col h-full">
            <div className="flex items-start justify-between pb-4 border-b border-border shrink-0">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Project Team</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Members assigned to this project and their roles.</p>
              </div>
              <button className="text-[11px] text-primary font-semibold hover:underline shrink-0 mt-0.5">View All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-5 flex-1">
              {project.team.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-purple-700 shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block leading-tight">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {m.name === project.manager ? 'Project Manager' : 'Team Member'}
                      </span>
                    </div>
                  </div>
                  {m.name === project.manager && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-semibold shrink-0">
                      Owner
                    </span>
                  )}
                </div>
              ))}
            </div>
            {project.extraTeam > 0 && (
              <div className="pt-3 mt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground font-semibold">+{project.extraTeam} more members not shown</span>
              </div>
            )}
          </Card>
        </div>

        {/* Key Dates */}
        <div className="lg:col-span-4 flex flex-col">
          <Card className="p-6 flex flex-col h-full">
            <div className="pb-4 border-b border-border shrink-0">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Key Dates</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Important milestones and deadlines.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 mt-5 text-xs flex-1">
              {[
                { label: 'Start Date', value: project.startDate },
                { label: 'Submission', value: project.submissionDate },
                { label: 'End Date', value: project.targetEndDate },
                { label: 'Days Left', value: project.daysLeft, highlight: true },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                  <span className={`font-semibold text-sm ${item.highlight ? 'text-purple-600' : 'text-foreground'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Row 4: Activity Feed (full width) ─────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Activity</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Latest updates and actions from your team.</p>
          </div>
          <button className="text-[11px] text-primary font-semibold hover:underline shrink-0 mt-0.5">View All</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {activities.map((act) => {
            const ActIcon = act.icon;
            return (
              <div key={act.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50">
                <div className={`p-1.5 rounded-lg ${act.iconBg} shrink-0`}>
                  <ActIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground leading-snug">{act.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{act.user}</p>
                  <p className="text-[10px] text-muted-foreground/70">{act.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
