import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { Button, Tabs } from 'antd';
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
import Card from "@/components/ui/Card";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";

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
          <Button onClick={() => navigate("/tasks")} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Projects
          </Button>
        )}
      </div>

      {project ? (
        <>
          <Card className="mt-6">
            <h2 className="text-lg font-bold text-slate-800">{project.ProjectName}</h2>
            <p className="mt-1 text-base text-slate-500 font-mono">{project.ProjectCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project.WorkStatusName}</Badge>
              <Badge>{project.PriorityName}</Badge>
              <Badge>{project.ProjectTypeName}</Badge>
            </div>
          </Card>

          <div className="mt-6 flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab}
                type="text"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500"
                }`}
              >
                {tab}
              </Button>
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
            <SearchInput
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                  setCurrentPage(1);
                }, 400);
              }}
              placeholder="Search projects..."
              containerClassName="w-48 lg:w-56"
            />
          </div>

          <hr className="border-slate-200 my-4" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projectsLoading ? (
              <div className="col-span-full p-6 text-base text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="col-span-full p-6 text-base text-muted-foreground text-center">No projects found.</div>
            ) : (
              projects.map((item) => (
                <Card
                  key={item.ProjectInfoID}
                  hover
                  className="group text-left cursor-pointer"
                  onClick={() => handleSelectProject(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.ProjectName}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{item.ProjectCode}</p>
                    </div>
                    {item.WorkStatusColor && (
                      <Badge style={{ background: item.WorkStatusColor, color: '#fff' }}>
                        {item.WorkStatusName}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge>{item.ProjectTypeName}</Badge>
                  </div>
                </Card>
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
