'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { BlockSkeleton } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';
import DateConverter from '@remotemerge/nepali-date-converter';

// --- Lookup Maps & Helpers ---
const priorityLabelMap: Record<number, string> = { 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' };
const projectTypeMap: Record<number, string> = { 0: 'General', 1: 'Development', 2: 'Infrastructure', 3: 'Design' };

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  Urgent: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  High: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  Medium: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  Low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700' },
  Completed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Overdue: { bg: 'bg-rose-100', text: 'text-rose-700' },
  'On Hold': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Not Started': { bg: 'bg-gray-100', text: 'text-gray-700' },
};

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(107, 114, 128, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  if (clean.length !== 6) return `rgba(107, 114, 128, ${alpha})`;

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return isNaN(r) || isNaN(g) || isNaN(b) ? `rgba(107, 114, 128, ${alpha})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr || dateStr.startsWith('0001')) return '—';
  try {
    const parts = dateStr.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
      const bs = new DateConverter(dateStr).toBs();
      return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.date).padStart(2, '0')}`;
    }
  } catch {
    // fallback: return original if conversion fails
  }
  return dateStr;
};
const formatCurrency = (amount?: number) => `Rs. ${(amount ?? 0).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --- API Fetcher (ProjectInfo only) ---
const fetchProjectInfo = async (projectId: string, signal?: AbortSignal): Promise<ApiProject> => {
  const base = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
  const sanitizedId = encodeURIComponent(projectId);

  const res = await apiCall(`${base}/GetProjectDetailData?id=${sanitizedId}`, { method: 'GET', signal }, 10000);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);

  const json = await res.json();
  const data = json?.Data ?? json?.data;
  const project = data?.ProjectInfo ?? data?.projectInfo;
  if (!project || !project.ProjectInfoID) throw new Error('Project details not found');
  return project;
};

// --- Reusable Micro-Components ---
const DetailItem = ({ label, value, badgeClass }: { label: string; value?: React.ReactNode; badgeClass?: string }) => (
  <div>
    <span className="text-muted-foreground block mb-0.5 text-xs font-medium uppercase tracking-wide">{label}</span>
    {badgeClass ? (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold ${badgeClass}`}>
        {value}
      </span>
    ) : (
      <span className="font-semibold text-foreground text-sm">{value || '—'}</span>
    )}
  </div>
);

const LoadingSkeleton = () => (
  <BlockSkeleton lines={3} className="max-w-screen-2xl mx-auto space-y-4" message="Loading project details..." />
);

// --- Main Page Component ---
export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      queryClient.cancelQueries({ queryKey: ['project-detail', id] });
    };
  }, [id, queryClient]);

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: ({ signal }) => fetchProjectInfo(id!, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !project || !project.ProjectInfoID) {
    return (
      <div className="fade-in space-y-3 max-w-screen-2xl mx-auto w-full pb-8">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Project details not found.'}
          </p>
        </Card>
      </div>
    );
  }

  const priorityName = project.PriorityName || priorityLabelMap[project.Priority ?? 3] || 'Medium';
  const projectTypeName = project.ProjectTypeName || projectTypeMap[project.ProjectType ?? 0] || 'General';
  const workStatusColor = project.WorkStatusColor || '#6B7280';
  const statusColor = statusStyles[project.WorkStatusName] || statusStyles['Not Started'];
  const priorityStyle = priorityStyles[priorityName] || priorityStyles['Medium'];

  const hasDocuments = Boolean(project.Attachments || project.TOR);
  const hasRemarks = Boolean(project.Tippani || project.Samghauta || project.Kalyades);

  return (
    <div className="fade-in space-y-3 max-w-screen-2xl mx-auto w-full pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        {project.CanEdit && (
          <Button
            variant="primary"
            size="md"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => navigate('/projects/create', { state: { projectId: project.ProjectInfoID } })}
          >
            Edit Project
          </Button>
        )}
      </div>

      {/* Hero Card */}
      <Card padding="p-5">
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 pl-4"
          style={{ borderColor: workStatusColor }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: hexToRgba(workStatusColor, 0.1), color: workStatusColor }}
            >
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{project.ProjectName}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{project.ProjectCode}</p>
              {project.Description && (
                <p className="text-sm text-muted-foreground/80 mt-1.5 line-clamp-2 max-w-3xl">{project.Description}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: hexToRgba(workStatusColor, 0.1),
                    color: workStatusColor,
                    borderColor: hexToRgba(workStatusColor, 0.25),
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: workStatusColor }} />
                  {project.WorkStatusName}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                  {priorityName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-border bg-white/60 text-muted-foreground">
                  {projectTypeName}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right lg:min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{formatCurrency(project.TotalBudget)}</p>
          </div>
        </div>
      </Card>

      {/* Project Information */}
      <Card padding="p-5">
        <div className="pb-2 border-b border-border">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Project Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mt-3">
          <DetailItem label="Project Code" value={project.ProjectCode} />
          <DetailItem label="Project Type" value={projectTypeName} />
          <DetailItem label="Priority" value={priorityName} badgeClass={`${priorityStyle.bg} ${priorityStyle.text}`} />
          <DetailItem label="Status" value={project.WorkStatusName} badgeClass={`${statusColor.bg} ${statusColor.text}`} />
          <DetailItem label="Start Date" value={formatDate(project.StartDate)} />
          <DetailItem label="Project Open Date" value={formatDate(project.ProjectOpenDate)} />
          <DetailItem label="Duration" value={`${project.ProjectDuration} days`} />
          <DetailItem label="Total Budget" value={formatCurrency(project.TotalBudget)} />
          <DetailItem label="Last Date of Submission" value={formatDate(project.LastDateOfSubmission)} />
          <DetailItem label="Bank Guarantee Issue Date" value={formatDate(project.BankGuranteeIssueDate)} />
          <DetailItem label="Bank Guarantee Expiry Date" value={formatDate(project.BankGuranteeExpiryDate)} />
          <DetailItem label="Project Head" value={project.ProjectHeadEmpName} />
          <DetailItem label="Department" value={project.DepartmentName} />
          <DetailItem label="Expense Code" value={project.ExpenseCode} />
          <DetailItem label="Budget Info" value={project.BudgetInfoName} />
        </div>
        {project.Description && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-2">Description</span>
            <p className="text-sm text-foreground/80 leading-relaxed">{project.Description}</p>
          </div>
        )}
      </Card>

      {/* Remarks & Notes */}
      {hasRemarks && (
        <Card padding="p-6">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Remarks & Notes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {project.Tippani && <DetailItem label="Tippani" value={project.Tippani} />}
            {project.Samghauta && <DetailItem label="Samghauta" value={project.Samghauta} />}
            {project.Kalyades && <DetailItem label="Kalyades" value={project.Kalyades} />}
          </div>
        </Card>
      )}

      {/* Documents & Links */}
      {hasDocuments && (
        <Card padding="p-6">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Documents & Links</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {project.Attachments && (
              <a
                href={project.Attachments}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-white/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground block">Attachments</span>
                  <span className="text-sm font-semibold text-foreground">View Attachments</span>
                </div>
              </a>
            )}
            {project.TOR && (
              <a
                href={project.TOR}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-white/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground block">TOR</span>
                  <span className="text-sm font-semibold text-foreground">View TOR</span>
                </div>
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
