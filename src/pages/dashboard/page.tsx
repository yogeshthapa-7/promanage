'use client';

import { useState, useMemo } from 'react';
import StatCardsRow from './components/StatCardsRow';
import ProjectOverviewSection from './components/ProjectOverviewSection';
import RecentActivity from './components/RecentActivity';
import ProjectsTable from './components/ProjectsTable';
import { projects, type ProjectStatus } from '@/lib/projects-data';
import Topbar from '@/components/Topbar';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'All'>('All');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let data = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }
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
  }, [search, filterStatus, sortField, sortDir]);

  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto w-full fade-in">
      <Topbar
        pageTitle="Dashboard"
        pageSubtitle="Welcome back To Project Management Dashboard! 👋"
        showFilters
        searchValue={search}
        onSearchChange={setSearch}
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
      <hr className="border-slate-200 my-6" />

      {/* KPI Stat Cards */}
      <StatCardsRow projects={filtered.length ? filtered : projects} />

      {/* Middle row: Project Overview + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <ProjectOverviewSection />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Projects Table */}
      <ProjectsTable
        projects={filtered}
        search={search}
        onSearchChange={setSearch}
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
      />
    </div>
  );
}
