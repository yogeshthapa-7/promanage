import { useEffect, useState } from "react";
import type { ApiProject } from "@/types/projects-data";
import { convertAdToBs } from "@/utils/nepali-date";
import { apiCall } from "@/services/apiservice";
import { Modal, message, Button } from "antd";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LayoutGrid, List, Pencil, Trash2, Plus, Search, RotateCcw } from "lucide-react";
import IssueCreate from "./Create";
import IssueSearch from "./Search";
import AppTable from '@/components/ui/AppTable';
import { TableSkeleton } from '@/components/ui/Loaders';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const ISSUES_API = `${API_BASE}/Issues/ServerSearch`;

interface IssueItem {
  IssuesID: number;
  IssuesTitle: string;
  LabelInfoID: number;
  Comments: string;
  Attachments: string;
  ProjectInfoID: number;
  WorkStatusID: number;
  ProjectInfoName: string;
  WorkStatusName: string;
  LabelInfoName: string;
  LabelColor: string;
  CreatedDate: string;
  RaisedBy: string;
  WorkStatusColor: string;
  CanChangeStatus: boolean;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
}

interface IssueTabProps {
  project: ApiProject;
}

export default function IssueTab({ project }: IssueTabProps) {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [allIssues, setAllIssues] = useState<IssueItem[]>([]);

  const handleDeleteIssue = (issue: IssueItem) => {
    Modal.confirm({
      title: 'Delete Issue',
      content: `Are you sure you want to delete "${issue.IssuesTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteIssues?id=${issue.IssuesID}`, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Issue deleted successfully');
          setIssues((prev) => prev.filter((i) => i.IssuesID !== issue.IssuesID));
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete issue');
        }
      },
    });
  };

  const loadIssues = () => {
    const controller = new AbortController();
    let cancelled = false;
    setIssuesLoading(true);
    setIssues([]);

    apiCall(ISSUES_API, {
      method: "POST",
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: "IssuesID", name: "IssuesID", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "IssuesTitle", name: "IssuesTitle", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "Comments", name: "Comments", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "RaisedBy", name: "RaisedBy", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "CreatedDate", name: "CreatedDate", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "WorkStatusName", name: "WorkStatusName", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "LabelInfoName", name: "LabelInfoName", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "LabelColor", name: "LabelColor", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "Priority", name: "Priority", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "PriorityName", name: "PriorityName", searchable: true, orderable: true, search: { value: "", regex: "" } },
            { data: "WorkStatusColor", name: "WorkStatusColor", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          IssuesID: 0,
          IssuesTitle: "",
          LabelInfoID: 0,
          Comments: "",
          Attachments: "",
           ProjectInfoID: project.ProjectInfoID ?? Number(project.ProjectInfoID),
          WorkStatusID: 0,
          ProjectInfoName: "",
          WorkStatusName: "",
          LabelInfoName: "",
          LabelColor: "",
          CreatedDate: "",
          RaisedBy: "",
          WorkStatusColor: "",
          CanChangeStatus: true,
          CanEdit: true,
          CanDelete: true,
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          const data = Array.isArray(json?.data) ? json.data : [];
          setIssues(data);
          setAllIssues(data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setIssuesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  };

  useEffect(() => {
    const cleanup = loadIssues();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const handleClearIssueSearch = () => {
    setIsSearchOpen(false);
    setIsSearchActive(false);
    setIssues(allIssues);
  };

  const handleAdd = () => {
    setEditingIssue(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (issue: IssueItem) => {
    setEditingIssue(issue);
    setIsCreateOpen(true);
  };

  const issueColumns = [
    {
      title: 'Issue',
      dataIndex: 'IssuesTitle',
      key: 'IssuesTitle',
      render: (text: string, record: IssueItem) => (
        <div>
          <div className="font-semibold text-slate-900">{record.IssuesTitle}</div>
          {record.Comments && (
            <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">{record.Comments}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Label',
      dataIndex: 'LabelInfoName',
      key: 'LabelInfoName',
      render: (_, record: IssueItem) =>
        record.LabelInfoName ? (
          <Badge
            style={{
              background: record.LabelColor ? `${record.LabelColor}15` : undefined,
              color: record.LabelColor || undefined,
              borderColor: record.LabelColor ? `${record.LabelColor}40` : undefined,
            }}
          >
            {record.LabelInfoName}
          </Badge>
        ) : null,
    },
    {
      title: 'Status',
      dataIndex: 'WorkStatusName',
      key: 'WorkStatusName',
      render: (status: string) => status ? <Badge>{status}</Badge> : null,
    },
    {
      title: 'Raised By',
      dataIndex: 'RaisedBy',
      key: 'RaisedBy',
      render: (text: string) => text || '—',
    },
    {
      title: 'Date',
      dataIndex: 'CreatedDate',
      key: 'CreatedDate',
      render: (date: string) => convertAdToBs(date) || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: IssueItem) => (
        <div className="flex items-center justify-end gap-1">
          {record.HasUserRightToEdit && <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => handleEdit(record)} />}
          {record.HasUserRightToDelete && (
            <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteIssue(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button icon={<Search size={16} />} onClick={() => setIsSearchOpen(true)}>
            Search
          </Button>
          <Button icon={<RotateCcw size={16} />} onClick={handleClearIssueSearch}>
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
            <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
            <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
          </div>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
            Add Issue
          </Button>
        </div>
      </div>
      {isSearchOpen && (
        <IssueSearch
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={(values) => {
            const searchTitle = String(values.IssuesTitle || '').toLowerCase();
            const searchRaisedBy = String(values.RaisedBy || '').toLowerCase();
            setIsSearchActive(true);
            setIssues(() => {
              if (!searchTitle && !searchRaisedBy) return allIssues;
              return allIssues.filter((issue) => {
                const matchesTitle = !searchTitle || issue.IssuesTitle.toLowerCase().includes(searchTitle);
                const matchesRaisedBy = !searchRaisedBy || issue.RaisedBy.toLowerCase().includes(searchRaisedBy);
                return matchesTitle && matchesRaisedBy;
              });
            });
          }}
          onClear={handleClearIssueSearch}
          project={project}
          modal={false}
        />
      )}

      {issuesLoading ? (
        <TableSkeleton />
      ) : issues.length === 0 ? (
        <Card>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">
            {isSearchActive ? 'No issues match your search.' : 'No issues found.'}
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <AppTable
          columns={issueColumns}
          dataSource={issues}
          rowKey={(record) => record.IssuesID}
          cardClassName="mt-4 overflow-x-auto"
          rowHoverClassName="hover:bg-slate-50/60"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {issues.map((issue) => (
            <Card key={issue.IssuesID} hover className="flex flex-col">
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-900 truncate">{issue.IssuesTitle}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                  {issue.LabelInfoName && (
                    <Badge
                      style={{
                        background: issue.LabelColor ? `${issue.LabelColor}15` : undefined,
                        color: issue.LabelColor || undefined,
                        borderColor: issue.LabelColor ? `${issue.LabelColor}40` : undefined,
                      }}
                    >
                      {issue.LabelInfoName}
                    </Badge>
                  )}
                  {issue.WorkStatusName && (
                    <Badge>{issue.WorkStatusName}</Badge>
                  )}
                  <span>•</span>
                  <span>Raised by: {issue.RaisedBy || "—"}</span>
                  <span>•</span>
                   <span>{convertAdToBs(issue.CreatedDate)}</span>
                </div>
                {issue.Comments && (
                  <p className="mt-2 text-base text-slate-500 line-clamp-2">{issue.Comments}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                {issue.HasUserRightToEdit && <Button size="small" onClick={() => handleEdit(issue)}>Edit</Button>}
                {issue.HasUserRightToDelete && (
                  <Button size="small" danger onClick={() => handleDeleteIssue(issue)}>Delete</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <IssueCreate
        open={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingIssue(null); }}
        onSuccess={() => { setIsCreateOpen(false); setEditingIssue(null); loadIssues(); }}
        project={project}
        editingIssue={editingIssue}
      />
    </div>
  );
}


