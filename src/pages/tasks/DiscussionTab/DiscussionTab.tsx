import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const DISCUSSION_API = `${API_BASE}/ProjectDiscussion/ServerSearch`;

interface ProjectDiscussionItem {
  SN: number;
  ProjectDiscussionID: number;
  DiscussionTitle: string;
  ProjectInfoID: number;
  Priority: number;
  PriorityName: string;
  Status: number;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
  CreatedDate: string;
}

interface DiscussionTabProps {
  project: ApiProject;
}

export default function DiscussionTab({ project }: DiscussionTabProps) {
  const [discussions, setDiscussions] = useState<ProjectDiscussionItem[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setDiscussionsLoading(true);
    setDiscussions([]);

    apiCall(DISCUSSION_API, {
      method: "POST",
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 100,
          columns: [
            { data: "ProjectDiscussionID", name: "ProjectDiscussionID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectDiscussionID: 0,
          DiscussionTitle: "",
          ProjectInfoID: project.ProjectInfoID ?? Number(project.id),
          Priority: 0,
          PriorityName: "",
          RaisedBy: "",
          CreatedDate: "",
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
          setDiscussions(Array.isArray(json?.data) ? json.data : []);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setDiscussionsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project]);

  if (discussionsLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading discussions...</div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No discussions found.</div>
    );
  }

  return (
    <div className="space-y-3">
      {discussions.map((d) => (
        <div key={d.ProjectDiscussionID} className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-base font-bold text-slate-900">{d.DiscussionTitle}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Priority: {d.PriorityName}</span>
            <span>•</span>
            <span>{d.CreatedDate}</span>
            {d.HasUserRightToEdit && <span className="text-blue-600">Editable</span>}
            {d.HasUserRightToDelete && <span className="text-rose-600">Deletable</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
