'use client';

import { useState, useEffect, useMemo } from 'react';
import StatCardsRow from './components/StatCardsRow';
import ProjectOverviewSection from './components/ProjectOverviewSection';
import TaskProgressChart from './components/TaskProgressChart';
import RecentProjectsCard from './components/RecentProjectsCard';
import EntitySummaryCard from './components/EntitySummaryCard';
import ProjectsTable from './components/ProjectsTable';
import { type Project, type ProjectStatus, type ApiProject, mapApiProjectToProject } from '@/lib/projects-data';
import { fetchAllProjectTaskCounts } from '@/lib/tasks-data';
import Topbar from '@/components/Topbar';
import { useDashboardStats } from './components/useDashboardStats';
import { apiCall } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

export default function DashboardPage() {
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'All'>('All');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const body = {
          model: {
            draw: 1,
            start: 0,
            length: 20,
            columns: [
              { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
              { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: '' } },
              { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
            ],
            search: { value: '', regex: '' },
            order: [{ column: 0, dir: 'desc' }],
          },
          param: {
            ProjectInfoID: 0,
          },
        };

        const res = await apiCall(`${API_BASE}/ProjectInfo/ServerSearch`, {
          method: 'POST',
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
        let mapped = rows.map(mapApiProjectToProject);

        if (mapped.length > 0) {
          try {
            const countsById = await fetchAllProjectTaskCounts(controller.signal);
            mapped = mapped.map((p) => {
              const c = countsById[Number(p.id)];
              if (!c) return p;
              return {
                ...p,
                totalTasks: c.total || 0,
                tasksCompleted: c.completed || 0,
                taskStatusCounts: c.byStatus || {},
              };
            });
          } catch {
            // keep mapped projects without task counts
          }
        }

        if (!cancelled) {
          setProjects(mapped.length > 0 ? mapped : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const filtered = useMemo(() => {
    let data = [...projects];
    if (filterStatus !== 'All') {
      data = data.filter((p) => p.status === filterStatus);
    }
    data.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'name') { av = a.name; bv = b.name; }
      else if (sortField === 'status') { av = a.status; bv = b.status; }
      else if (sortField === 'progress') { av = a.progress; bv = b.progress; }
      else if (sortField === 'startDate') { av = a.startDate; bv = b.startDate; }
      else if (sortField === 'dueDate') { av = a.dueDate; bv = b.dueDate; }
      else if (sortField === 'priority') {
        const order: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        av = order[a.priority];
        bv = order[b.priority];
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filterStatus, sortField, sortDir, projects]);

  const stats = useDashboardStats(filtered.length ? filtered.length : projects.length);
  const statsPayload = {
    projects: filtered.length ? filtered.length : projects.length,
    users: stats.users,
    employees: stats.employees,
    departments: stats.departments,
    organizations: stats.organizations,
    tasks: stats.tasks,
  };

  const dataProjects = filtered.length ? filtered : projects;
  const combinedLoading = loading || stats.loading;

  return (
    <div className="flex flex-col gap-4 max-w-screen-2xl mx-auto w-full fade-in">
      <Topbar
        pageTitle="Dashboard"
        pageSubtitle="Welcome back To Project Management Dashboard!"
        showFilters
        showSearch={false}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={(field) => {
          if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
          } else {
            setSortField(field);
            setSortDir('asc');
          }
        }}
      />
      <hr className="border-slate-200 mt-[-26px]" />

      {/* KPI Stat Cards */}
      <StatCardsRow stats={statsPayload} loading={combinedLoading} />

      {/* Middle row: Project Overview + Task Progress + Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1">
          <ProjectOverviewSection projects={dataProjects} loading={combinedLoading} />
        </div>
        <div className="xl:col-span-1">
          <TaskProgressChart projects={dataProjects} loading={combinedLoading} />
        </div>
        <div className="xl:col-span-1">
          <RecentProjectsCard projects={dataProjects} loading={combinedLoading} />
        </div>
      </div>

      {/* Entity Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <EntitySummaryCard
          title="Users"
          count={stats.users}
          description="Registered users across all workspaces."
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
          href="/users"
          loading={combinedLoading}
        />
        <EntitySummaryCard
          title="Employees"
          count={stats.employees}
          description="Active employees in the system."
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          href="/employee"
          loading={combinedLoading}
        />
        <EntitySummaryCard
          title="Departments"
          count={stats.departments}
          description="Departments in the organization."
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
          iconBg="#F3F0FF"
          iconColor="#7C3AED"
          href="/departments"
          loading={combinedLoading}
        />
        <EntitySummaryCard
          title="Organizations"
          count={stats.organizations}
          description="Registered organizations."
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>}
          iconBg="#FFFBEB"
          iconColor="#D97706"
          href="/Organizations"
          loading={combinedLoading}
        />
      </div>

      {/* Projects Table */}
      <ProjectsTable
        projects={dataProjects}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={(field) => {
          if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
          } else {
            setSortField(field);
            setSortDir('asc');
          }
        }}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        loading={loading}
      />
    </div>
  );
}
