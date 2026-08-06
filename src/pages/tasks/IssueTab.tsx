import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

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
  CanEdit: boolean;
  CanDelete: boolean;
}

interface IssueTabProps {
  project: ApiProject;
}

export default function IssueTab({ project }: IssueTabProps) {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

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
          length: 100,
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

  if (issuesLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">Loading issues...</div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground text-center">No issues found.</div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <div key={issue.IssuesID} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">{issue.IssuesTitle}</h4>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {issue.LabelInfoName && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                    style={{
                      backgroundColor: issue.LabelColor ? `${issue.LabelColor}15` : undefined,
                      color: issue.LabelColor || undefined,
                      borderColor: issue.LabelColor ? `${issue.LabelColor}40` : undefined,
                    }}
                  >
                    {issue.LabelInfoName}
                  </span>
                )}
                {issue.WorkStatusName && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {issue.WorkStatusName}
                  </span>
                )}
                <span>•</span>
                <span>Raised by: {issue.RaisedBy || "—"}</span>
                <span>•</span>
                <span>{issue.CreatedDate}</span>
              </div>
              {issue.Comments && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{issue.Comments}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {issue.CanEdit && <span className="text-[10px] text-blue-600 font-semibold">Edit</span>}
              {issue.CanDelete && <span className="text-[10px] text-rose-600 font-semibold">Delete</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
