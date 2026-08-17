import { useEffect, useState } from "react";
import { Modal, message, Button } from "antd";
import { Trash2 } from "lucide-react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const MILESTONE_API = `${API_BASE}/ProjectMilestone/ServerSearch`;

interface MilestoneItem {
  ProjectMilestoneID: number;
  ProjectInfoID: number;
  MilestoneTitle: string;
  WorkStatusID: number;
  MilestoneCost: number;
  StartDate: string;
  EndDate: string;
  Summary: string;
  Progress: number;
}

interface MilestoneTabProps {
  project: ApiProject;
}

export default function MilestoneTab({ project }: MilestoneTabProps) {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setMilestonesLoading(true);
    setMilestones([]);

    apiCall(MILESTONE_API, {
      method: "POST",
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 20,
          columns: [
            { data: "ProjectMilestoneID", name: "ProjectMilestoneID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectMilestoneID: 0,
          ProjectInfoID: project.ProjectInfoID ?? Number(project.id),
          MilestoneTitle: "",
          WorkStatusID: 0,
          MilestoneCost: 0,
          StartDate: "",
          EndDate: "",
          Summary: "",
          Progress: 0,
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          setMilestones(Array.isArray(json?.data) ? json.data : []);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setMilestonesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project]);

  const handleDeleteMilestone = (milestone: MilestoneItem) => {
    Modal.confirm({
      title: "Delete Milestone",
      content: `Are you sure you want to delete "${milestone.MilestoneTitle}"?`,
      okText: "Delete",
      okType: "danger",
      zIndex: 10000,
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteProjectMilestone?id=${milestone.ProjectMilestoneID}`, { method: "GET" });
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success("Milestone deleted successfully");
          setMilestones((prev) => prev.filter((m) => m.ProjectMilestoneID !== milestone.ProjectMilestoneID));
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Failed to delete milestone");
        }
      },
    });
  };

  if (milestonesLoading) {
    return (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading milestones...</div>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No milestones found.</div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {milestones.map((milestone) => {
        const progressColor =
          milestone.Progress >= 75
            ? "#10B981"
            : milestone.Progress >= 40
            ? "#3B82F6"
            : milestone.Progress > 0
            ? "#F59E0B"
            : "#D1D5DB";

        return (
          <Card key={milestone.ProjectMilestoneID} hover className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 truncate">{milestone.MilestoneTitle}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button type="text" size="small" danger icon={<Trash2 size={16} />} onClick={() => handleDeleteMilestone(milestone)} />
                <span className="text-sm font-bold text-slate-700">{milestone.Progress}%</span>
              </div>
            </div>

            {milestone.Summary && (
              <p className="text-base text-slate-500 line-clamp-3">{milestone.Summary}</p>
            )}

            <ProgressBar value={Math.min(milestone.Progress, 100)} color={progressColor} />

            <div className="flex items-center justify-between text-base text-muted-foreground">
              <span>Start: {milestone.StartDate || "—"}</span>
              <span>End: {milestone.EndDate || "—"}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-base text-muted-foreground">Milestone Cost</span>
              <span className="text-sm font-semibold text-slate-700">{milestone.MilestoneCost.toLocaleString()}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
