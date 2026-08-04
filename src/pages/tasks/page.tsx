import { Plus } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ApiProject, Project } from "@/lib/projects-data";
import { mapApiProjectToProject } from "@/lib/projects-data";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const PROJECTS_API = `${API_BASE}/ProjectInfo/ServerSearch`;

const serverSearchBody = {
  model: {
    draw: 1,
    start: 0,
    length: 1000,
    columns: [
      { data: "ProjectInfoID", name: "ProjectInfoID", searchable: true, orderable: true, search: { value: "", regex: "" } },
      { data: "ProjectName", name: "ProjectName", searchable: true, orderable: true, search: { value: "", regex: "" } },
      { data: "ProjectCode", name: "ProjectCode", searchable: true, orderable: true, search: { value: "", regex: "" } },
    ],
    search: { value: "", regex: "" },
    order: [{ column: 0, dir: "desc" }],
  },
  param: { ProjectInfoID: 0 },
};

const tabs = ["Task", "Discussion", "Issue", "Milestone", "Timeline", "Kanban"] as const;
type Tab = typeof tabs[number];

export default function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const project = (location.state as { project?: ApiProject } | undefined)?.project;
  const [activeTab, setActiveTab] = useState<Tab>("Task");

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) return;
    let cancelled = false;
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(PROJECTS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(serverSearchBody),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
        if (!cancelled) setProjects(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project]);

  const handleSelectProject = (item: ApiProject) => {
    navigate("/tasks", { state: { project: item } });
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Sub-Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize, prioritize and track all your projects sub-tasks in one place.
          </p>
        </div>

        {project && (
          <button
            onClick={() => navigate("/tasks")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </button>
        )}
        {!project && (
          <button
            onClick={() => {}}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Task
          </button>
        )}
      </div>

      {project ? (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-800">{project.ProjectName}</h2>
            <p className="mt-1 text-xs text-slate-500 font-mono">{project.ProjectCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {project.WorkStatusName}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {project.PriorityName}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {project.ProjectTypeName}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              {activeTab} content coming soon.
            </div>
          </div>

          <hr className="border-slate-200 my-6" />
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Select a project</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Choose a project to view its sub-tasks.</p>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading projects...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {projects.map((item) => (
                <button
                  key={item.ProjectInfoID}
                  type="button"
                  onClick={() => handleSelectProject(item)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.ProjectName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{item.ProjectCode}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {item.WorkStatusName}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {item.PriorityName}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {!loading && projects.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">No projects found.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
