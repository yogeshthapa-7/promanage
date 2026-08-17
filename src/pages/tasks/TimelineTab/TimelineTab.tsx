import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";
import Card from "@/components/ui/Card";

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
  project?: ApiProject | null;
  projectId?: number | null;
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

export default function TimelineTab({ project, projectId }: TimelineTabProps) {
  const [timelines, setTimelines] = useState<TimelineItem[]>([]);
  const [timelinesLoading, setTimelinesLoading] = useState(false);

  // Determine the ID to use
  const activeProjectId = projectId ?? project?.ProjectInfoID ?? (project?.id ? Number(project.id) : null);

  useEffect(() => {
    if (!activeProjectId) return;
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
          length: 20,
          columns: [{ data: "ProjectInfoID", name: "ProjectInfoID", searchable: true, orderable: true, search: { value: "", regex: "" } }],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: { ProjectInfoID: activeProjectId },
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
  }, [activeProjectId]);

  if (timelinesLoading) {
    return (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">Loading timeline...</div>
      </Card>
    );
  }

  if (timelines.length === 0) {
    return (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">No progress history found for this project.</div>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-16 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
          Project Timeline
        </h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {project?.ProjectName || "Progress Overview"}
        </p>
      </div>

      {/* Timeline Stream */}
      <div className="relative w-full flex flex-col">
        {timelines.map((item, idx) => {
          const palette = getStepColor(idx);
          const nextPalette = getStepColor(idx + 1);
          const isLeft = idx % 2 === 0;
          const hasNext = idx < timelines.length - 1;
          const itemNumber = timelines.length - idx;

          // Colors for SVG gradient
          const hexColors: Record<string, string> = {
            "bg-indigo-600": "#4f46e5",
            "bg-blue-600": "#2563eb",
            "bg-cyan-600": "#0891b2",
            "bg-amber-600": "#d97706",
            "bg-emerald-600": "#059669",
            "bg-rose-600": "#e11d48",
          };
          const currentColor = hexColors[palette.bg] || "#94a3b8";
          const nextColorHex = hexColors[nextPalette.bg] || "#94a3b8";

          return (
            <div
              key={item.CreateDateTime + idx}
              className="flex w-full relative group"
            >
              {/* Left Column (Card or Empty) */}
              <div className="w-[calc(50%-40px)] sm:w-[calc(50%-60px)] pb-12 flex justify-end pr-4 sm:pr-8">
                {isLeft && (
                  <TimelineCard
                    palette={palette}
                    item={item}
                    itemNumber={itemNumber}
                    isLeft={true}
                  />
                )}
              </div>

              {/* Center Column (Nodes and Zigzag Lines) */}
              <div className="w-[80px] sm:w-[120px] relative shrink-0">
                {/* Connecting SVG Line to Next Node */}
                {hasNext && (
                  <svg
                    className="absolute top-[38px] left-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                    viewBox="0 0 120 100"
                  >
                    <defs>
                      <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={currentColor} />
                        <stop offset="100%" stopColor={nextColorHex} />
                      </linearGradient>
                    </defs>
                    <line
                      x1={isLeft ? 28 : 92}
                      y1="0"
                      x2={!isLeft ? 28 : 92}
                      y2="100"
                      stroke={`url(#grad-${idx})`}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* The Circular Node */}
                <div
                  className={`absolute top-4 w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[4px] border-white z-10 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 ${
                    palette.bg
                  } ${isLeft ? "left-0 sm:left-1" : "right-0 sm:right-1"}`}
                >
                  <span className="text-white font-bold text-sm sm:text-base">
                    {itemNumber}
                  </span>
                </div>
              </div>

              {/* Right Column (Card or Empty) */}
              <div className="w-[calc(50%-40px)] sm:w-[calc(50%-60px)] pb-12 flex justify-start pl-4 sm:pl-8">
                {!isLeft && (
                  <TimelineCard
                    palette={palette}
                    item={item}
                    itemNumber={itemNumber}
                    isLeft={false}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({
  palette,
  item,
  itemNumber,
  isLeft,
}: {
  palette: { text: string; bg: string; dot: string; accent: string };
  item: TimelineItem;
  itemNumber: number;
  isLeft: boolean;
}) {
  return (
    <div className="w-full max-w-md bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left relative z-20">
      
      {/* Visual Category / Title */}
      <div className="mb-3">
        <h3 className={`text-lg font-bold leading-tight ${palette.text}`}>
          {item.TraceKeyName || "Milestone Logged"}
        </h3>
      </div>
      
      {/* Main Content */}
      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-4 font-medium">
        {item.Remarks || "No additional remarks were provided for this log entry."}
      </div>

      {/* Footer / Metadata */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-50 text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1 text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {item.CreatedDate}
        </span>
        <span>•</span>
        <span>{item.CreatedTime}</span>
      </div>
    </div>
  );
}
