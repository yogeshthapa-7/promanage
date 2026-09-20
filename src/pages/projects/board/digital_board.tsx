'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';
import nepallogo from '@/assets/images/nepal_logo.png';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
};

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
  const startDate = project.StartDate || '—';
  const duration = project.ProjectDuration ? `${project.ProjectDuration} days` : '—';
  const status = project.WorkStatusName || '—';

  return (
    <div
      className="fade-in min-h-screen flex items-center justify-center relative"
    >
      <button
        onClick={() => navigate('/projects')}
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </button>

      <div className="w-full max-w-3xl">
        {/* 3D Bumpy Board */}
        <div
          className="relative w-full bg-white rounded-3xl border border-slate-200/80 flex flex-col"
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
        {/* Top texture overlay for bumpy feel
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        /> */}

        {/* Logos Row */}
        <div className="relative flex items-center justify-between px-8 pt-8 pb-4">
          {/* Left Logo */}
          <div className="shrink-0 w-28 h-28 flex items-center justify-center">
            <img
              src={nepallogo} alt = "Left Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          {/* Center Header */}
          <div className="flex-1 text-center px-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              नेपाल सरकार
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600 uppercase tracking-widest">
              {projectHead}
            </p>
          </div>

          {/* Right Logo */}
          <div className="shrink-0 w-28 h-28 flex items-center justify-center">
            <img
              src={nepallogo} alt= "right_logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Divider with 3D effect */}
        <div className="mx-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

        {/* Project Title */}
        <div className="px-8 pt-6 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center break-words" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
            {projectTitle}
          </h2>
        </div>

        {/* Project Details Grid */}
        <div className="px-8 py-6">
          <h3 className="text-base font-bold text-slate-700 uppercase tracking-wider mb-4 text-center">
            Project Details
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Project Type', value: projectType },
              { label: 'Start Date', value: startDate },
              { label: 'Duration', value: duration },
              { label: 'Status', value: status },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200/80 transition-transform duration-200 hover:scale-[1.02]"
                style={{
                  boxShadow: `
                    0 1px 2px rgba(0,0,0,0.04),
                    inset 0 1px 0 rgba(255,255,255,0.8),
                    inset 0 -1px 0 rgba(0,0,0,0.04)
                  `,
                }}
              >
                <div className="text-sm font-semibold text-slate-500">
                  {item.label}:
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">
                  {item.value}
                </div>
              </div>
            ))}
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
