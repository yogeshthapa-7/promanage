import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { apiCall } from "@/lib/api";
import type { ApiProject } from "@/lib/projects-data";
import TasksTab from "./TasksTab/TasksTab";
import SubTasksTab from "./SubTasksTab/SubTasksTab";
import DiscussionTab from "./DiscussionTab/DiscussionTab";
import TimelineTab from "./TimelineTab/TimelineTab";
import IssueTab from "./IssueTab/IssueTab";
import MilestoneTab from "./MilestoneTab/MilestoneTab";
import KanbanTab from "./KanbanTab/KanbanTab";
import type { TaskItem } from "@/lib/tasks-data";
import Pagination from "@/components/ui/Pagination";

const API_BASE = (import.meta.env.VITE_BASE_API_URL || "").replace(/\/$/, "");
const PROJECTS_API = `${API_BASE}/ProjectInfo/ServerSearch`;
const PROJECTS_PAGE_SIZE = 12;

const buildProjectSearchBody = (start: number, length: number, search?: string) => ({
  model: {
    draw: 1,
    start,
    length,
    columns: [
      { data: "ProjectInfoID", name: "ProjectInfoID", searchable: true, orderable: true, search: { value: search || "", regex: "" } },
      { data: "ProjectName", name: "ProjectName", searchable: true, orderable: true, search: { value: search || "", regex: "" } },
      { data: "ProjectCode", name: "ProjectCode", searchable: true, orderable: true, search: { value: search || "", regex: "" } },
    ],
    search: { value: search || "", regex: "" },
    order: [{ column: 0, dir: "desc" }],
  },
  param: { ProjectInfoID: 0 },
});

const tabs = ["Task", "SubTask", "Discussion", "Issue", "Milestone", "Timeline", "Kanban"] as const;
type Tab = typeof tabs[number];

export default function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const project = (location.state as { project?: ApiProject } | undefined)?.project;
  const [activeTab, setActiveTab] = useState<Tab>("Task");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    setSelectedTask(null);
    setActiveTab("Task");
  }, [project]);

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (project) return;
    const controller = new AbortController();
    let cancelled = false;
    setProjectsLoading(true);
    const start = (currentPage - 1) * PROJECTS_PAGE_SIZE;
    apiCall(PROJECTS_API, {
      method: "POST",
      body: JSON.stringify(buildProjectSearchBody(start, PROJECTS_PAGE_SIZE, searchQuery)),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
        if (!cancelled) {
          setProjects(rows);
          setTotalRecords(json.recordsTotal ?? rows.length);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [project, currentPage]);

  const handleSelectProject = (item: ApiProject) => {
    navigate("/tasks", { state: { project: item } });
  };

  const handleTaskSelect = (task: TaskItem) => {
    setSelectedTask(task);
    setActiveTab("SubTask");
  };

  const renderTabContent = () => {
    if (!project) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground text-center">
          Select a project to view its tasks.
        </div>
      );
    }

    switch (activeTab) {
      case "Task":
        return <TasksTab project={project} selectedTask={selectedTask} onTaskSelect={handleTaskSelect} />;
      case "SubTask":
        return <SubTasksTab project={project} selectedTask={selectedTask} />;
      case "Discussion":
        return <DiscussionTab project={project} />;
      case "Timeline":
        return <TimelineTab project={project} />;
      case "Issue":
        return <IssueTab project={project} />;
      case "Milestone":
        return <MilestoneTab project={project} />;
      case "Kanban":
        return <KanbanTab project={project} />;
      default:
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-slate-500">
            {activeTab} content coming soon.
          </div>
        );
    }
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="mt-1 text-base text-slate-500">
            Organize, prioritize and track all your projects tasks in one place.
          </p>
        </div>

        {project && (
          <button
            onClick={() => navigate("/tasks")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </button>
        )}
      </div>

      {project ? (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-bold text-slate-800">{project.ProjectName}</h2>
            <p className="mt-1 text-base text-slate-500 font-mono">{project.ProjectCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-sm font-semibold text-slate-700">
                {project.WorkStatusName}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-sm font-semibold text-slate-700">
                {project.PriorityName}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-sm font-semibold text-slate-700">
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
                className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
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
            {renderTabContent()}
          </div>

          <hr className="border-slate-200 my-6" />
        </>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-base text-muted-foreground">Please select the projects to view tasks.</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }
                  debounceTimerRef.current = setTimeout(() => {
                    setCurrentPage(1);
                  }, 400);
                }}
                placeholder="Search projects..."
                className="text-sm border border-slate-200 rounded-lg pl-9 pr-8 py-2 w-48 lg:w-56 bg-white focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                      }
                      setCurrentPage(1);
                    }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <hr className="border-slate-200 my-4" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projectsLoading ? (
              <div className="col-span-full p-6 text-base text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="col-span-full p-6 text-base text-muted-foreground text-center">No projects found.</div>
            ) : (
              projects.map((item) => (
                <button
                  key={item.ProjectInfoID}
                  type="button"
                  onClick={() => handleSelectProject(item)}
                  className="group text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:border-slate-300 hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.ProjectName}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{item.ProjectCode}</p>
                    </div>
                    {item.WorkStatusColor && (
                      <span
                        className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: item.WorkStatusColor }}
                      >
                        {item.WorkStatusName}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {item.ProjectTypeName}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {!project && (
        <Pagination
          total={totalRecords}
          currentPage={currentPage}
          pageSize={PROJECTS_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
