import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/projects-data";
import { apiCall } from "@/lib/api";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const TIMELINE_API = `${API_BASE}/ProjectTimelineInfo/ServerSearch`;

// Updated to perfectly match your backend response structure
interface TimelineItem {
  ProjectInfoID: number;
  Remarks: string;
  TraceKey: number; // Mapped as number
  TraceID: number;
  TraceKeyName: string; // Mapped human-readable string
  CreatedDate: string;
  CreatedTime: string;
  CreateDateTime: string;
}

interface TimelineTabProps {
  project: ApiProject;
}

// Clean premium colors matching your original reference image
const TIMELINE_COLORS = [
  { bg: "bg-indigo-600", border: "border-indigo-100", lightBg: "bg-indigo-50/50", text: "text-indigo-600" },
  { bg: "bg-blue-600", border: "border-blue-100", lightBg: "bg-blue-50/50", text: "text-blue-600" },
  { bg: "bg-cyan-500", border: "border-cyan-100", lightBg: "bg-cyan-50/50", text: "text-cyan-600" },
  { bg: "bg-amber-500", border: "border-amber-100", lightBg: "bg-amber-50/50", text: "text-amber-600" },
  { bg: "bg-emerald-500", border: "border-emerald-100", lightBg: "bg-emerald-50/50", text: "text-emerald-600" },
  { bg: "bg-rose-500", border: "border-rose-100", lightBg: "bg-rose-50/50", text: "text-rose-600" },
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
          columns: [
            { data: "ProjectInfoID", name: "ProjectInfoID", searchable: true, orderable: true, search: { value: "", regex: "" } },
          ],
          search: { value: "", regex: "" },
          order: [{ column: 0, dir: "desc" }],
        },
        param: {
          ProjectInfoID: project.ProjectInfoID ?? Number(project.id),
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
      <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-100 bg-white/60 p-12 text-center text-sm font-medium text-slate-400 backdrop-blur-md shadow-sm">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (timelines.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl border border-dashed border-slate-200 bg-white/40 p-16 text-center text-sm font-medium text-slate-400 backdrop-blur-sm">
        No progress history found for this project.
      </div>
    );
  }

  // Displaying chronological pipeline stream (Oldest down to Newest)
  const sortedTimelines = [...timelines];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 select-none font-sans overflow-hidden">
      
      {/* Dynamic Header Section */}
      <div className="text-center mb-20 relative">
        <h2 className="text-3xl font-black text-[#1E2E5D] tracking-tight mb-3">
          Project Timeline
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>{project.name || "Project Progress Overview"}</span>
        </p>
        <div className="w-24 h-[3px] bg-indigo-500 rounded-full mx-auto mt-4" />
        
      </div>

      {/* Modern High-Performance Ladder Stream */}
      <div className="relative w-full flex flex-col items-center">
        
        {/* Central Pure CSS Vertical Spine Rails (Real Ladder Illusion) */}
        <div className="absolute top-4 bottom-4 w-4 flex justify-between pointer-events-none opacity-60">
          <div className="w-[3px] h-full bg-slate-200/80 rounded-full" />
          <div className="w-[3px] h-full bg-slate-200/80 rounded-full" />
        </div>

        <div className="w-full flex flex-col gap-10 relative">
          {sortedTimelines.map((item, idx) => {
            const palette = getStepColor(idx);
            const isLeft = idx % 2 === 0;
            const itemNumber = sortedTimelines.length - idx; // Beautiful reversed visual step numbering

            return (
              <div
                key={item.CreateDateTime + idx}
                className={`w-full flex flex-col md:flex-row items-center justify-center relative group`}
              >
                
                {/* Horizontal Ladder Rung Linker (Pure CSS decoration, will not lag) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block w-16 h-[2px] bg-slate-200 pointer-events-none z-0" />

                {/* Cylinder Pill Card Structure */}
                <div className={`w-full md:w-[45%] flex justify-center px-2 z-10 ${
                  isLeft ? "md:justify-end md:pr-10" : "md:justify-start md:pl-10"
                }`}>
                  <div
                    className="w-full max-w-sm bg-white border border-slate-100 rounded-full py-3.5 px-6 flex items-center justify-between gap-4 relative transition-all duration-300 will-change-transform group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:shadow-[0_20px_40px_-15px_rgba(30,46,93,0.12)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)]"
                  >
                    {/* Inner Details Container */}
                    <div className="flex-1 min-w-0 text-left order-1">
                      {/* Human Readable Action Category Name */}
                      <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${palette.text}`}>
                        {item.TraceKeyName || "System Milestone"}
                      </span>
                      
                      {/* Main Remark String Text */}
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-snug truncate whitespace-pre-line max-h-10">
                        {item.Remarks || "No logged descriptions recorded."}
                      </h4>
                      
                      {/* Timestamps Footers */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-slate-400">
                        <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-100">
                          ID: #{item.TraceID}
                        </span>
                        <span>{item.CreatedDate}</span>
                        <span>•</span>
                        <span>{item.CreatedTime}</span>
                      </div>
                    </div>

                    {/* Numeric Pill Badge - Placed inside perfectly */}
                    <div
                      className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white font-black text-sm shadow-md order-2 transition-transform duration-300 group-hover:rotate-6 ${palette.bg}`}
                    >
                      {String(itemNumber).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                {/* Micro Node intersection junction right on top of the spine rails */}
                <div className="hidden md:block w-4 h-4 shrink-0 z-20 relative">
                  <div 
                    className="w-3 h-3 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-md transition-all duration-300 group-hover:scale-125"
                    style={{ backgroundColor: `var(--node-color, #cbd5e1)` }}
                  />
                </div>

                {/* Mirror layout balancer space for uniform desktop grids */}
                <div className="hidden md:block w-[45%]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}