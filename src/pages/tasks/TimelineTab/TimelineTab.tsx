import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;

interface TimelineItem {
  ProjectInfoID: number;
  Remarks: string;
  TraceKey: number;
  TraceID: number;
  TraceKeyName: string;
  CreatedDate: string;
  CreatedTime: string;
  CreateDateTime: string;
}

interface TimelineTabProps {
  project: ApiProject;
}

const TIMELINE_COLORS = [
  { text: "text-indigo-600", bg: "bg-indigo-600", dot: "border-indigo-600", accent: "bg-indigo-50" },
  { text: "text-blue-600", bg: "bg-blue-600", dot: "border-blue-600", accent: "bg-blue-50" },
  { text: "text-cyan-600", bg: "bg-cyan-600", dot: "border-cyan-600", accent: "bg-cyan-50" },
  { text: "text-amber-600", bg: "bg-amber-600", dot: "border-amber-600", accent: "bg-amber-50" },
  { text: "text-emerald-600", bg: "bg-emerald-600", dot: "border-emerald-600", accent: "bg-emerald-50" },
  { text: "text-rose-600", bg: "bg-rose-600", dot: "border-rose-600", accent: "bg-rose-50" },
];

function getStepColor(index: number) {
  return TIMELINE_COLORS[index % TIMELINE_COLORS.length];
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
          columns: [{ data: "ProjectInfoID", name: "ProjectInfoID", searchable: true, orderable: true, search: { value: "", regex: "" } }],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: { ProjectInfoID: project.ProjectInfoID ?? Number(project.id) },
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
        if (err.name !== "AbortError") console.error(err);
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
      <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-100 bg-white/80 p-12 text-center shadow-sm">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (timelines.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto rounded-2xl border border-dashed border-slate-200 bg-white/80 p-16 text-center text-sm font-medium text-slate-400">
        No progress history found for this project.
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-16 font-sans select-none">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Project Timeline
        </h2>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {project.name || project.ProjectName || "Progress Overview"}
        </p>
      </div>

      {/* Timeline Stream */}
      <div className="relative w-full">
        {/* 3D Ladder Rail */}
        <div className="absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-1/2 w-4 h-full pointer-events-none" />
        <div className="timeline-rail absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-1/2 w-[2px] h-full pointer-events-none" />

        <div className="w-full flex flex-col gap-8 relative">
          {timelines.map((item, idx) => {
            const palette = getStepColor(idx);
            const isLeft = idx % 2 === 0;
            const itemNumber = timelines.length - idx;

            return (
              <div
                key={item.CreateDateTime + idx}
                className="w-full flex flex-col md:flex-row items-start md:items-center relative"
              >
                {/* Card side */}
                <div
                  className={`w-full md:w-1/2 ${isLeft ? "md:pr-8 md:ml-auto md:pl-0" : "md:pl-8"} flex justify-start md:justify-end`}
                  data-side={isLeft ? "left" : "right"}
                >
                  <TimelineCard
                    palette={palette}
                    item={item}
                    itemNumber={itemNumber}
                  />
                </div>

                {/* 3D Ladder rung + node at intersection */}
                <div
                  className="timeline-step absolute top-0 bottom-0 left-4 md:left-1/2 md:-translate-x-1/2"
                  data-side={isLeft ? "left" : "right"}
                />

                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center z-20">
                  <div
                    className={`timeline-node ${palette.dot.replace("border-", "border-")} border-2`}
                    style={{ color: palette.bg.replace("bg-", "").replace("-600", "") }}
                  />
                  <span className="sr-only">Step {itemNumber}</span>
                </div>

                {/* Empty spacer for desktop grid alignment */}
                <div className="hidden md:block w-1/2" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimelineCard({
  palette,
  item,
  itemNumber,
}: {
  palette: { text: string; bg: string; dot: string; accent: string };
  item: TimelineItem;
  itemNumber: number;
}) {
  return (
    <div
      className={`
        timeline-card
        group w-full max-w-md
        rounded-xl p-5
        flex flex-col gap-3
        relative
      `}
    >
      {/* Top row with Category Action & Visual Number Tag */}
      <div className="flex items-center justify-between gap-4">
        <span className={`text-sm font-bold uppercase tracking-wider ${palette.text}`}>
          {item.TraceKeyName || "Milestone"}
        </span>
        <span
          className={`text-sm font-mono font-bold px-2.5 py-1 rounded-md ${palette.accent} ${palette.text}`}
        >
          #{String(itemNumber).padStart(2, "0")}
        </span>
      </div>

      {/* Core Description Text */}
      <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-relaxed whitespace-pre-line">
        {item.Remarks || "No logged descriptions recorded."}
      </h4>

      {/* Metadata / Timestamp footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-sm font-medium text-slate-400">
        <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-100">
          ID: #{item.TraceID}
        </span>
        <span>{item.CreatedDate}</span>
        <span>•</span>
        <span>{item.CreatedTime}</span>
      </div>
    </div>
  );
}
