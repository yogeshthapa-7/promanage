'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import type { ApiProject } from '@/lib/projects-data';

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

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const projectId = id;
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    fetch(`${(import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '')}/ProjectInfo/ServerSearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 1000,
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
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
        const json = await res.json();
        const found = (json.data ?? []).find((p: ApiProject) => String(p.ProjectInfoID) === projectId) ?? null;
        return found;
      })
      .then((p) => {
        if (!cancelled) {
          setProject(p);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load project');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
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

  const statusStyle = statusClasses[project.WorkStatusName] || statusClasses['Not Started'];
  const priorityStyle = priorityClasses[project.PriorityName] || priorityClasses['Medium'];

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '0001-01-01T00:00:00' || dateStr === '0001/1/1') return '—';
    return dateStr;
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
        {project.CanEdit && (
          <button
            onClick={() => navigate('/projects/create', { state: { editingProject: project } })}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Project
          </button>
        )}
      </div>

      {/* Header Card */}
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground truncate">{project.ProjectName}</h1>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{project.ProjectCode}</p>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.Description}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {project.WorkStatusName}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                {project.PriorityName}
              </span>
              <span className="text-[11px] text-muted-foreground">{project.ProjectTypeName}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Budget</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(project.TotalBudget)}</p>
          </div>
        </div>
      </Card>

      {/* Project Information */}
      <Card className="p-6">
        <div className="pb-4 border-b border-border">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Project Information</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Core details and metadata about this project.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 mt-5 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">Project Code</span>
            <span className="font-semibold text-foreground">{project.ProjectCode}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Project Type</span>
            <span className="font-semibold text-foreground">{project.ProjectTypeName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Priority</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
              {project.PriorityName}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Status</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
              {project.WorkStatusName}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Start Date</span>
            <span className="font-semibold text-foreground">{formatDate(project.StartDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Project Open Date</span>
            <span className="font-semibold text-foreground">{formatDate(project.ProjectOpenDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Duration (Days)</span>
            <span className="font-semibold text-foreground">{project.ProjectDuration}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Total Budget</span>
            <span className="font-semibold text-foreground">{formatCurrency(project.TotalBudget)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Last Date of Submission</span>
            <span className="font-semibold text-foreground">{formatDate(project.LastDateOfSubmission || '')}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Bank Guarantee Issue Date</span>
            <span className="font-semibold text-foreground">{formatDate(project.BankGuranteeIssueDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Bank Guarantee Expiry Date</span>
            <span className="font-semibold text-foreground">{formatDate(project.BankGuranteeExpiryDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Project Head</span>
            <span className="font-semibold text-foreground">{project.ProjectHeadEmpName}</span>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground block mb-1.5">Description</span>
          <p className="text-xs text-foreground/80 leading-relaxed">{project.Description}</p>
        </div>
      </Card>

      {/* Documents & Links */}
      <Card className="p-6">
        <div className="pb-4 border-b border-border">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Documents & Links</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Attachments and terms of reference.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-xs">
          <a
            href={project.Attachments}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Attachments</span>
              <span className="font-semibold text-foreground">View Attachments</span>
            </div>
          </a>
          <a
            href={project.TOR}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-[10px] text-muted-foreground block">TOR</span>
              <span className="font-semibold text-foreground">View TOR</span>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
