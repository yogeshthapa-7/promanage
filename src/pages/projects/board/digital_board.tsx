'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';
import { mapApiProjectToProject } from '@/lib/projects-data';
import DateConverter from '@remotemerge/nepali-date-converter';
import nepallogo from '@/assets/images/nepal_logo.png';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
};

const NEPALI_MONTHS = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भदौ',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फागुन',
  'चैत',
];

const toNepaliDate = (dateStr?: string) => {
  if (!dateStr || dateStr.startsWith('0001')) return '—';
  try {
    const bs = new DateConverter(dateStr).toBs();
    const monthName = NEPALI_MONTHS[bs.month - 1] || String(bs.month);
    return `${bs.year} ${monthName} ${bs.date}`;
  } catch {
    return dateStr;
  }
};

function getDerivedStatus(api: ApiProject): string {
  const dueDate = api.ProjectOpenDate || '';
  const progress = getProgressFromDates(api.StartDate, dueDate);
  const finalProgress = progress > 0 || (api.StartDate && dueDate) ? progress : getProgress(api.WorkStatusName || '');
  if (finalProgress === 100) return 'Completed';
  if (finalProgress >= 81) return 'In Progress Final';
  if (finalProgress >= 11) return 'In Progress';
  if (finalProgress >= 1) return 'Started';
  return api.WorkStatusName || 'Not Started';
}

function getProgressFromDates(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const now = new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progress = Math.round((elapsed / totalDuration) * 100);
  return Math.min(Math.max(progress, 0), 100);
}

function getProgress(status: string): number {
  if (status === 'Completed') return 100;
  if (status === 'In Progress' || status === 'In Progress Final') return 50;
  if (status === 'On Hold') return 20;
  return 0;
}

const DigitalBoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiCall(`${API_BASE}/GetProjectDetailData?id=${encodeURIComponent(id)}`, { method: 'GET' }, 10000)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        const data = json?.Data ?? json?.data;
        const p = data?.ProjectInfo ?? data?.projectInfo;
        if (!p || !p.ProjectInfoID) throw new Error('Project details not found');
        if (!cancelled) setProject(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load project');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in flex items-center justify-center min-h-screen text-slate-500">
        <div className="text-lg font-medium">Loading digital board...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="fade-in flex items-center justify-center min-h-screen text-rose-600">
        <div className="text-lg font-medium">{error || 'Project not found'}</div>
      </div>
    );
  }

  const projectTitle = project.ProjectName || 'Untitled Project';
  const projectHead = project.ProjectHeadEmpName || '—';
  const projectType = project.ProjectTypeName || projectTypeMap[project.ProjectType ?? 0] || 'General';
  const startDate = toNepaliDate(project.StartDate);
  const duration = project.ProjectDuration ? `${project.ProjectDuration} days` : '—';
  const status = getDerivedStatus(project);

  return (
    <div
      className="fade-in min-h-screen flex items-center justify-center relative"
    >
      <button
        onClick={() => navigate('/projects')}
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </button>

      <div className="w-full max-w-[32rem]">
        {/* 3D Bumpy Board */}
        <div
          className="relative w-full bg-white rounded-3xl border border-slate-200 flex flex-col"
          style={{
            transform: 'perspective(1200px) rotateX(2deg) rotateY(-1deg)',
            boxShadow: `
              0 1px 1px rgba(0,0,0,0.04),
              0 2px 2px rgba(0,0,0,0.04),
              0 4px 4px rgba(0,0,0,0.04),
              0 8px 8px rgba(0,0,0,0.04),
              0 16px 16px rgba(0,0,0,0.04),
              0 32px 32px rgba(0,0,0,0.04),
              inset 0 1px 0 rgba(255,255,255,0.9),
              inset 0 -1px 0 rgba(0,0,0,0.05)
            `,
          }}
        >
          {/* Logos Row */}
          <div className="relative flex items-center justify-between px-6 pt-6 pb-2">
            {/* Left Logo */}
            <div className="shrink-0 w-20 h-20 flex items-center justify-center">
              <img
                src={nepallogo}
                alt="Left Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Center Header */}
            <div className="flex-1 text-center px-2">
            <h1 className="text-2xl font-extrabold text-red-700 tracking-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
              नेपाल सरकार
            </h1>
            <p className="mt-1.5 text-xs font-bold text-blue-800 uppercase tracking-[0.2em]">
              {projectHead}
            </p>
            </div>

            {/* Right Logo */}
            <div className="shrink-0 w-20 h-20 flex items-center justify-center">
              <img
                src={nepallogo}
                alt="Right Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

          {/* Project Title */}
          <div className="px-6 pt-5 pb-2">
            <h2 className="text-xl font-bold text-blue-900 text-center break-words" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>
              {projectTitle}
            </h2>
          </div>

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-2 py-2 text-slate-400">
            <div className="h-px w-8 bg-slate-300" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-semibold">Project Details</span>
            <div className="h-px w-8 bg-slate-300" />
          </div>

          {/* Project Details */}
          <div className="px-6 py-4 space-y-2.5">
            {[
              { label: 'Project Type', value: projectType },
              { label: 'Start Date', value: startDate },
              { label: 'Duration', value: duration },
              { label: 'Status', value: status },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-slate-50/80 rounded-xl px-5 py-3 border border-slate-200/80 transition-transform duration-200 hover:scale-[1.01]"
                style={{
                  boxShadow: `
                    0 1px 2px rgba(0,0,0,0.03),
                    inset 0 1px 0 rgba(255,255,255,0.9),
                    inset 0 -1px 0 rgba(0,0,0,0.03)
                  `,
                }}
              >
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </div>
                <div className={`text-sm font-bold break-words ${item.label === 'Status' ? 'px-3 py-1 rounded-full bg-orange-100 text-orange-700' : 'text-slate-800'}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Description Title */}
          <div className="px-6 pt-5 pb-2">
            <h2 className="text-xl font-bold text-blue-900 text-center break-words" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>
              Description
            </h2>
          </div>

          {/* Description Content */}
          <div className="px-6 py-4 space-y-2.5">
            <div className="bg-slate-50/80 rounded-xl px-5 py-3 border border-slate-200/80">
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                {project.Description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Bottom 3D edge highlight */}
          <div
            className="h-2 rounded-b-3xl"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.01))',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DigitalBoardPage;
