'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  ListTodo,
  User,
  Phone,
  Mail,
  MapPin,
  FolderOpen,
  ListTodo as SubtaskIcon,
  FileText,
  AlertCircle,
  Building2,
  UserSquare,
  MessageSquare,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { apiCall } from '@/lib/api';
import type { ApiProject } from '@/lib/projects-data';

interface ClientInfo {
  ClientInfoID: number;
  ClientName: string | null;
  ClientCode: string | null;
  ContactPerson: string | null;
  ContactNo: string | null;
  Email: string | null;
  Address: string | null;
  ClientStatus: number;
  Logo: string | null;
}

interface DataCount {
  SubProjectCount: number;
  TaskCount: number;
  SubTaskCount: number;
  TotalEmpInvolvedCount: number;
}

interface ProjectDiscussion {
  ProjectDiscussionID: number;
  DiscussionTitle: string;
  ProjectInfoID: number;
  Priority: number;
  PriorityName: string;
  RaisedBy: string;
  CreatedDate: string;
  CanChangeStatus: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

interface HeadEmpInfo {
  EmployeeInfoID: number;
  Fullname: string;
  Address: string;
  Phone: string;
  Email: string;
  Gender: number;
  DOB: string | null;
  DepartmentID: number;
  MainBranchID: number;
  BranchID: number;
  Photo: string;
  EmpStatus: number;
  Username: string | null;
  Password: string | null;
  OrganizationOfficeID: number;
  DepartmentName: string;
  BranchName: string;
  MainBranchName: string;
  OrganizationOfficeName: string | null;
  TraceKey: string | null;
}

interface AssociatedEmployee {
  EmployeeInfoID: number;
  Fullname: string;
  Address: string;
  Phone: string;
  Email: string;
  Gender: number;
  DOB: string | null;
  DepartmentID: number;
  MainBranchID: number;
  BranchID: number;
  Photo: string;
  EmpStatus: number;
  Username: string | null;
  Password: string | null;
  OrganizationOfficeID: number;
  DepartmentName: string | null;
  BranchName: string | null;
  MainBranchName: string | null;
  OrganizationOfficeName: string | null;
  TraceKey: string;
}

interface ProjectDetailResponse {
  Data: {
    ProjectInfo: ApiProject;
    ClientInfo: ClientInfo;
    DataCount: DataCount;
    ProjectDiscussionList: ProjectDiscussion[];
    IssuesList: unknown[];
    HeadEmpInfo: HeadEmpInfo;
    AssociatedEmployee: AssociatedEmployee[];
  };
  Message: string | null;
  Success: boolean;
}

const priorityLabelMap: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  Urgent: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  High: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  Medium: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  Low: { bg: 'bg-gray-100', text: 'gray-700', border: 'border-gray-200' },
};

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  Completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  Overdue: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  'On Hold': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'Not Started': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

function getPriorityName(priority: number | null | undefined, priorityName: string | null | undefined): string {
  if (priorityName && priorityName.trim() !== '') return priorityName;
  if (priority !== null && priority !== undefined && priorityLabelMap[priority]) return priorityLabelMap[priority];
  return 'Medium';
}

function getProjectTypeName(projectType: number | null | undefined, projectTypeName: string | null | undefined): string {
  if (projectTypeName && projectTypeName.trim() !== '') return projectTypeName;
  if (projectType !== null && projectType !== undefined && projectTypeMap[projectType]) return projectTypeMap[projectType];
  return 'General';
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr || dateStr === '0001-01-01T00:00:00' || dateStr === '0001/1/1') return '—';
  return dateStr;
};

const formatCurrency = (amount?: number) => {
  const val = amount ?? 0;
  return `Rs. ${val.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ProjectAvatar = ({ src, alt, size = 80 }: { src: string; alt: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) {
    return (
      <div
        className="rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-md flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }
  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading="lazy"
      className="rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
};

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ProjectDetailResponse['Data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectId = id;
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let cancelled = false;
    const controller = new AbortController();

    const fetchDetail = async () => {
      try {
        const base = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
        const endpoints = [
          `${base}/GetProjectDetailData?id=${projectId}`,
          `${base}/ProjectInfo/GetProjectDetailData?id=${projectId}`,
          `${base}/ProjectDetail/GetProjectDetailData?id=${projectId}`,
        ];
        let res: Response | undefined;
        for (const url of endpoints) {
          res = await apiCall(url, { method: 'GET', signal: controller.signal });
          if (res.ok) break;
        }
        if (!res || !res.ok) throw new Error(`Failed to fetch project: ${res?.statusText ?? 'no response'}`);
        const json = await res.json();
        const data = json?.Data ?? json?.data ?? null;
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load project');
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

   if (loading) {
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
           <p className="text-sm text-muted-foreground">Loading project...</p>
         </Card>
       </div>
     );
   }

   if (error || !detail) {
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
           <p className="text-sm text-muted-foreground">{error ? `Error: ${error}` : 'Project not found.'}</p>
         </Card>
      </div>
    );
  }

  const project = detail.ProjectInfo;
  const { ClientInfo, DataCount, ProjectDiscussionList, IssuesList, HeadEmpInfo, AssociatedEmployee } = detail;

  const priorityName = getPriorityName(project.Priority, project.PriorityName);
  const projectTypeName = getProjectTypeName(project.ProjectType, project.ProjectTypeName);
  const workStatusColor = project.WorkStatusColor || '#6B7280';
  const statusColor = statusStyles[project.WorkStatusName] || statusStyles['Not Started'];
  const priorityStyle = priorityStyles[priorityName] || priorityStyles['Medium'];

  const hasDocuments = project.Attachments || project.TOR;
  const hasRemarks = project.Tippani || project.Samghauta || project.Kalyades;
  const hasClientInfo = ClientInfo.ClientInfoID > 0 && (ClientInfo.ClientName || ClientInfo.ContactPerson || ClientInfo.Email);

  return (
    <div className="fade-in space-y-3 max-w-screen-2xl mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            icon={<ListTodo className="w-4 h-4" />}
            onClick={() => navigate('/tasks', { state: { project } })}
          >
            View Tasks
          </Button>
          {project.CanEdit && (
            <Button
              variant="primary"
              size="md"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => navigate('/projects/create', { state: { editingProject: project } })}
            >
              Edit Project
            </Button>
          )}
        </div>
      </div>

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
                {projectTypeName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-border bg-white/60 text-muted-foreground">
                    {projectTypeName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right lg:min-w-[180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{formatCurrency(project.TotalBudget)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Sub Projects"
          value={DataCount.SubProjectCount}
          trend="total"
          trendUp={true}
          iconBg="#F3F0FF"
          iconColor="#7C3AED"
          iconType="folder"
        />
        <StatCard
          title="Tasks"
          value={DataCount.TaskCount}
          trend="total"
          trendUp={true}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          iconType="check"
        />
        <StatCard
          title="Sub Tasks"
          value={DataCount.SubTaskCount}
          trend="total"
          trendUp={true}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
          icon={<SubtaskIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Team Members"
          value={DataCount.TotalEmpInvolvedCount}
          trend="involved"
          trendUp={true}
          iconBg="#FDF2F8"
          iconColor="#EC4899"
          iconType="users"
        />
        <StatCard
          title="Duration"
          value={`${project.ProjectDuration} days`}
          trend="total"
          trendUp={true}
          iconBg="#FFFBEB"
          iconColor="#F59E0B"
          iconType="clock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <Card padding="p-5">
            <div className="pb-2 border-b border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Project Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Project Code</span>
                <span className="font-semibold text-foreground">{project.ProjectCode}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Project Type</span>
                <span className="font-semibold text-foreground">{projectTypeName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5 text-xs font-medium uppercase tracking-wide">Priority</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
                  {priorityName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5 text-xs font-medium uppercase tracking-wide">Status</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                  {project.WorkStatusName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Start Date</span>
                <span className="font-semibold text-foreground">{formatDate(project.StartDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Project Open Date</span>
                <span className="font-semibold text-foreground">{formatDate(project.ProjectOpenDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Duration</span>
                <span className="font-semibold text-foreground">{project.ProjectDuration} days</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Total Budget</span>
                <span className="font-semibold text-foreground">{formatCurrency(project.TotalBudget)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Last Date of Submission</span>
                <span className="font-semibold text-foreground">{formatDate(project.LastDateOfSubmission)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Bank Guarantee Issue Date</span>
                <span className="font-semibold text-foreground">{formatDate(project.BankGuranteeIssueDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Bank Guarantee Expiry Date</span>
                <span className="font-semibold text-foreground">{formatDate(project.BankGuranteeExpiryDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Project Head</span>
                <span className="font-semibold text-foreground">{project.ProjectHeadEmpName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Department</span>
                <span className="font-semibold text-foreground">{HeadEmpInfo?.DepartmentName || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Expense Code</span>
                <span className="font-semibold text-foreground">{project.ExpenseCode || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs font-medium uppercase tracking-wide">Budget Info</span>
                <span className="font-semibold text-foreground">{project.BudgetInfoName || '—'}</span>
              </div>
            </div>
            {project.Description && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-2">Description</span>
                <p className="text-sm text-foreground/80 leading-relaxed">{project.Description}</p>
              </div>
            )}
          </Card>

          {hasRemarks && (
            <Card padding="p-6">
              <div className="pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Remarks & Notes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {project.Tippani && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1.5">Tippani</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{project.Tippani}</p>
                  </div>
                )}
                {project.Samghauta && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1.5">Samghauta</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{project.Samghauta}</p>
                  </div>
                )}
                {project.Kalyades && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1.5">Kalyades</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{project.Kalyades}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card padding="p-6">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Discussions</h3>
            </div>
            <div className="mt-4">
              {ProjectDiscussionList.length > 0 ? (
                <div className="space-y-3">
                  {ProjectDiscussionList.map((discussion) => (
                    <div
                      key={discussion.ProjectDiscussionID}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border bg-white/40"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{discussion.DiscussionTitle}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>
                            Raised by <span className="font-medium text-foreground">{discussion.RaisedBy}</span>
                          </span>
                          <span className="text-border">•</span>
                          <span>{formatDate(discussion.CreatedDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {discussion.PriorityName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No discussions yet</p>
                </div>
              )}
            </div>
          </Card>

          <Card padding="p-6">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Issues</h3>
            </div>
            <div className="mt-4">
              {IssuesList.length > 0 ? (
                <div className="space-y-3">
                  {IssuesList.map((issue: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-border bg-white/40">
                      <p className="text-sm text-foreground/80">{JSON.stringify(issue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No issues reported</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card padding="p-6">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Project Head</h3>
            </div>
            <div className="mt-5 flex flex-col items-center text-center">
              <ProjectAvatar src={HeadEmpInfo.Photo} alt={HeadEmpInfo.Fullname} size={80} />
              <p className="mt-3 text-sm font-bold text-foreground">{HeadEmpInfo.Fullname}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Project Head</p>
              <div className="mt-4 w-full space-y-2.5 text-left">
                {HeadEmpInfo.DepartmentName && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-muted-foreground truncate">{HeadEmpInfo.DepartmentName}</span>
                  </div>
                )}
                {HeadEmpInfo.BranchName && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <UserSquare className="w-4 h-4" />
                    </div>
                    <span className="text-muted-foreground truncate">{HeadEmpInfo.BranchName}</span>
                  </div>
                )}
                {HeadEmpInfo.Phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-muted-foreground">{HeadEmpInfo.Phone}</span>
                  </div>
                )}
                {HeadEmpInfo.Email && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-muted-foreground truncate">{HeadEmpInfo.Email}</span>
                  </div>
                )}
                {HeadEmpInfo.Address && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-muted-foreground">{HeadEmpInfo.Address}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {AssociatedEmployee.length > 0 && (
            <Card padding="p-6">
              <div className="pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Team Members</h3>
              </div>
              <div className="mt-4 space-y-1">
                {AssociatedEmployee.map((emp) => (
                  <div key={emp.EmployeeInfoID} className="flex items-center gap-3 py-2">
                    <Avatar src={emp.Photo} alt={emp.Fullname} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{emp.Fullname}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.Email || emp.Phone || '—'}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {emp.TraceKey}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {hasClientInfo && (
            <Card padding="p-6">
              <div className="pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Client Information</h3>
              </div>
              <div className="mt-4 space-y-3">
                {ClientInfo.ClientName && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1">Client Name</span>
                    <p className="text-sm font-semibold text-foreground">{ClientInfo.ClientName}</p>
                  </div>
                )}
                {ClientInfo.ContactPerson && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-muted-foreground">{ClientInfo.ContactPerson}</span>
                  </div>
                )}
                {ClientInfo.ContactNo && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-muted-foreground">{ClientInfo.ContactNo}</span>
                  </div>
                )}
                {ClientInfo.Email && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-muted-foreground truncate">{ClientInfo.Email}</span>
                  </div>
                )}
                {ClientInfo.Address && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-muted-foreground">{ClientInfo.Address}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

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
