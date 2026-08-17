import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import { Modal, message, Button } from "antd";
import Card from "@/components/ui/Card";
import DiscussionCreate from "./Create";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const discussionsRefetch = () => {
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
          length: 20,
          columns: [
            { data: "ProjectDiscussionID", name: "ProjectDiscussionID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectDiscussionID: 0,
          DiscussionTitle: "",
            ProjectInfoID: project.ProjectInfoID ?? 0,
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
  };

  const handleDeleteDiscussion = (discussion: ProjectDiscussionItem) => {
    Modal.confirm({
      title: 'Delete Discussion',
      content: `Are you sure you want to delete "${discussion.DiscussionTitle}"?`,
      okText: 'Delete',
      okType: 'danger',
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteProjectDiscussion?id=${discussion.ProjectDiscussionID}`, { method: 'GET' });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Discussion deleted successfully');
          setDiscussions((prev) => prev.filter((d) => d.ProjectDiscussionID !== discussion.ProjectDiscussionID));
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Failed to delete discussion');
        }
      },
    });
  };

  useEffect(() => {
    discussionsRefetch();
  }, [project]);

  if (discussionsLoading) {
    return (
      <Card>
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading discussions...</div>
    </Card>
    );
  }

  if (discussions.length === 0) {
    return (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No discussions found.</div>
      </Card>
    );
  }

  return (
  <div className="space-y-3">
    <div className="flex items-center justify-end">
      <Button type="primary" onClick={() => setIsCreateOpen(true)}>
        Add Discussion
      </Button>
    </div>
    {discussions.map((d) => (
      <Card key={d.ProjectDiscussionID} hover>
        <h4 className="text-base font-bold text-slate-900">{d.DiscussionTitle}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
          <span>Priority: {d.PriorityName}</span>
          <span>•</span>
          <span>{d.CreatedDate}</span>
          {d.HasUserRightToEdit && <span className="text-blue-600">Editable</span>}
          {d.HasUserRightToDelete && (
            <Button type="link" size="small" danger onClick={() => handleDeleteDiscussion(d)}>
              Deletable
            </Button>
          )}
        </div>
      </Card>
    ))}
    <DiscussionCreate
      open={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
      onSuccess={() => {
        setIsCreateOpen(false);
        discussionsRefetch();
      }}
      project={project}
    />
  </div>
);
}
