import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;

interface TimelineItem {
  SN: number;
  ProjectTimelineInfoID: number;
  ProjectInfoID: number;
  Remarks: string;
  TraceKey: string;
  TraceID: number;
}

interface TimelineTabProps {
  project: ApiProject;
}

export default function TimelineTab({ project }: TimelineTabProps) {
  const [timelines, setTimelines] = useState<TimelineItem[]>([]);
  const [timelinesLoading, setTimelinesLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setTimelinesLoading(true);
    setTimelines([]);

    apiCall(TIMELINE_API, {
      method: "POST",
      body: JSON.stringify({
        model: {
          draw: 1,
          start: 0,
          length: 100,
          columns: [
            { data: "ProjectTimelineInfoID", name: "ProjectTimelineInfoID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectTimelineInfoID: 0,
          ProjectInfoID: project.ProjectInfoID ?? Number(project.id),
          Remarks: "",
          TraceKey: "",
          TraceID: 0,
        },
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        if (!cancelled) {
          setTimelines(Array.isArray(json?.data) ? json.data : []);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => {
        if (!cancelled) setTimelinesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project]);

  if (timelinesLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">Loading timeline...</div>
    );
  }

  if (timelines.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground text-center">No timeline entries found.</div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />
      <div className="flex flex-col gap-4">
        {timelines.map((item) => (
          <div key={item.ProjectTimelineInfoID} className="flex gap-4">
            <div className="relative mt-1.5">
              <div className="w-[10px] h-[10px] rounded-full bg-purple-600 border-2 border-white shadow-sm shrink-0" />
            </div>
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                  #{item.SN} · {item.TraceKey || "Timeline"}
                </span>
                <span className="text-[10px] text-muted-foreground">ID: {item.ProjectTimelineInfoID}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{item.Remarks || "No remarks"}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">TraceID: {item.TraceID}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
