import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import { Modal, message, Button } from "antd";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Pencil, Trash2 } from "lucide-react";

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

  useEffect(() => {
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
          ProjectInfoID: project.ProjectInfoID ?? Number(project.id),
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
          setIssues(Array.isArray(json?.data) ? json.data : []);
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
  }, [project]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button type="primary" onClick={() => { /* open add-issue modal / navigate */ }}>
          Add Issue
        </Button>
      </div>

      {issuesLoading ? (
        <Card>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading issues...</div>
        </Card>
      ) : issues.length === 0 ? (
        <Card>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No issues found.</div>
        </Card>
      ) : (
        issues.map((issue) => (
          <Card key={issue.IssuesID} hover>
            <div className="flex items-start justify-between gap-3">
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
                  <span>{issue.CreatedDate}</span>
                </div>
                {issue.Comments && (
                  <p className="mt-2 text-base text-slate-500 line-clamp-2">{issue.Comments}</p>
                )}
              </div>
               <div className="flex items-center gap-1 shrink-0">
                 {issue.HasUserRightToEdit && <Button type="text" size="small" icon={<Pencil size={16} />} onClick={() => message.info('Edit issue coming soon')} />}
                 {issue.HasUserRightToDelete && (
                   <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteIssue(issue)}>
                     Delete
                   </Button>
                 )}
               </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
