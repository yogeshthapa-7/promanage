import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

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
          length: 100,
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

  if (milestonesLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">Loading milestones...</div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground text-center">No milestones found.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {milestones.map((milestone) => {
        const progressColor =
          milestone.Progress >= 75
            ? "bg-emerald-500"
            : milestone.Progress >= 40
            ? "bg-blue-500"
            : milestone.Progress > 0
            ? "bg-amber-500"
            : "bg-gray-300";

        return (
          <div key={milestone.ProjectMilestoneID} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 truncate">{milestone.MilestoneTitle}</h3>
              <span className="text-xs font-bold text-slate-700">{milestone.Progress}%</span>
            </div>

            {milestone.Summary && (
              <p className="text-xs text-slate-500 line-clamp-3">{milestone.Summary}</p>
            )}

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(milestone.Progress, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Start: {milestone.StartDate || "—"}</span>
              <span>End: {milestone.EndDate || "—"}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-muted-foreground">Milestone Cost</span>
              <span className="text-xs font-semibold text-slate-700">{milestone.MilestoneCost.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
