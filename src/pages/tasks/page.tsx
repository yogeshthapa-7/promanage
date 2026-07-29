import Pagination from "@/components/ui/Pagination";
import { useState, useCallback, useMemo, memo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Modal, Form, Input, Select, Slider, message } from "antd";

type TaskStatus = "To Do" | "In Progress" | "Completed";
type TaskPriority = "High" | "Medium" | "Low";

interface Task {
  id: string;
  title: string;
  description: string;
  project: { name: string; icon: string; color: string };
  assignee: { name: string; avatar: string };
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  daysLeft: number;
  progress: number;
}

const TASKS: Task[] = [
  {
    id: "1",
    title: "UI/UX Design for Dashboard",
    description: "Design the dashboard wireframe and UI",
    project: { name: "Mobile App Development", icon: "📱", color: "bg-emerald-100 text-emerald-600" },
    assignee: { name: "Anisha Gurung", avatar: "https://i.pravatar.cc/64?img=47" },
    status: "In Progress",
    priority: "High",
    dueDate: "May 15, 2025",
    daysLeft: 2,
    progress: 75,
  },
  {
    id: "2",
    title: "Setup Authentication Module",
    description: "Implement login and authentication",
    project: { name: "Mobile App Development", icon: "📱", color: "bg-emerald-100 text-emerald-600" },
    assignee: { name: "Prabin Thapa", avatar: "https://i.pravatar.cc/64?img=12" },
    status: "To Do",
    priority: "Medium",
    dueDate: "May 20, 2025",
    daysLeft: 7,
    progress: 0,
  },
  {
    id: "3",
    title: "API Integration",
    description: "Integrate APIs for user and data",
    project: { name: "Website Redesign", icon: "🌐", color: "bg-sky-100 text-sky-600" },
    assignee: { name: "Sagar Tamang", avatar: "https://i.pravatar.cc/64?img=15" },
    status: "In Progress",
    priority: "High",
    dueDate: "May 18, 2025",
    daysLeft: 5,
    progress: 40,
  },
  {
    id: "4",
    title: "Create Project Proposal",
    description: "Prepare proposal for client review",
    project: { name: "Marketing Campaign", icon: "📣", color: "bg-amber-100 text-amber-600" },
    assignee: { name: "Rita Shrestha", avatar: "https://i.pravatar.cc/64?img=45" },
    status: "To Do",
    priority: "Low",
    dueDate: "May 25, 2025",
    daysLeft: 12,
    progress: 0,
  },
  {
    id: "5",
    title: "Database Schema Design",
    description: "Design database schema and relationships",
    project: { name: "Data Centre Migration", icon: "🗄️", color: "bg-indigo-100 text-indigo-600" },
    assignee: { name: "Sagar Tamang", avatar: "https://i.pravatar.cc/64?img=15" },
    status: "In Progress",
    priority: "Medium",
    dueDate: "May 17, 2025",
    daysLeft: 4,
    progress: 60,
  },
  {
    id: "6",
    title: "Content Writing",
    description: "Write website content and copy",
    project: { name: "Website Redesign", icon: "🌐", color: "bg-sky-100 text-sky-600" },
    assignee: { name: "Anisha Gurung", avatar: "https://i.pravatar.cc/64?img=47" },
    status: "Completed",
    priority: "Low",
    dueDate: "May 10, 2025",
    daysLeft: 0,
    progress: 100,
  },
  {
    id: "7",
    title: "Testing & Bug Fixing",
    description: "Test the application and fix bugs",
    project: { name: "Mobile App Development", icon: "📱", color: "bg-emerald-100 text-emerald-600" },
    assignee: { name: "Prabin Thapa", avatar: "https://i.pravatar.cc/64?img=12" },
    status: "In Progress",
    priority: "High",
    dueDate: "May 16, 2025",
    daysLeft: 3,
    progress: 30,
  },
  {
    id: "8",
    title: "Deploy to Production",
    description: "Deploy application to production server",
    project: { name: "Data Centre Migration", icon: "🗄️", color: "bg-indigo-100 text-indigo-600" },
    assignee: { name: "Kathmandu Shikshalaya", avatar: "https://i.pravatar.cc/64?img=33" },
    status: "To Do",
    priority: "High",
    dueDate: "May 30, 2025",
    daysLeft: 17,
    progress: 0,
  },
  {
  id: "9",
  title: "Design Landing Page",
  description: "Create responsive landing page UI",
  project: { name: "Website Redesign", icon: "🌐", color: "bg-sky-100 text-sky-600" },
  assignee: { name: "Rita Shrestha", avatar: "https://i.pravatar.cc/64?img=45" },
  status: "In Progress",
  priority: "High",
  dueDate: "May 22, 2025",
  daysLeft: 9,
  progress: 50,
},
{
  id: "10",
  title: "Optimize Database Queries",
  description: "Improve query performance and indexing",
  project: { name: "Data Centre Migration", icon: "🗄️", color: "bg-indigo-100 text-indigo-600" },
  assignee: { name: "Prabin Thapa", avatar: "https://i.pravatar.cc/64?img=12" },
  status: "To Do",
  priority: "Medium",
  dueDate: "May 28, 2025",
  daysLeft: 15,
  progress: 0,
},
{
  id: "11",
  title: "Social Media Campaign",
  description: "Plan and schedule social media posts",
  project: { name: "Marketing Campaign", icon: "📣", color: "bg-amber-100 text-amber-600" },
  assignee: { name: "Kathmandu Shikshalaya", avatar: "https://i.pravatar.cc/64?img=33" },
  status: "In Progress",
  priority: "Low",
  dueDate: "May 24, 2025",
  daysLeft: 11,
  progress: 20,
},
{
  id: "12",
  title: "User Feedback Analysis",
  description: "Collect and analyze user feedback data",
  project: { name: "Mobile App Development", icon: "📱", color: "bg-emerald-100 text-emerald-600" },
  assignee: { name: "Anisha Gurung", avatar: "https://i.pravatar.cc/64?img=47" },
  status: "To Do",
  priority: "High",
  dueDate: "May 27, 2025",
  daysLeft: 14,
  progress: 0,
},
];

const TABS = ["All Tasks", "Overdue", "Completed"];

const STATUS_STYLE: Record<TaskStatus, string> = {
  "To Do": "bg-amber-50 text-amber-600 border-amber-200/60",
  "In Progress": "bg-violet-50 text-violet-600 border-violet-200/60",
  Completed: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
};

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  High: "bg-rose-50 text-rose-600 border-rose-200/60",
  Medium: "bg-amber-50 text-amber-600 border-amber-200/60",
  Low: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
};



const UPCOMING = [
  { title: "UI/UX Design for Dashboard", date: "May 15, 2025", left: "2 days left", color: "bg-violet-100 text-violet-600" },
  { title: "Testing & Bug Fixing", date: "May 16, 2025", left: "3 days left", color: "bg-orange-100 text-orange-600" },
  { title: "API Integration", date: "May 18, 2025", left: "5 days left", color: "bg-sky-100 text-sky-600" },
  { title: "Setup Authentication Module", date: "May 20, 2025", left: "7 days left", color: "bg-emerald-100 text-emerald-600" },
];

const progressColor = (p: number) => {
  if (p === 100) return "from-emerald-400 to-emerald-500";
  if (p >= 60) return "from-violet-400 to-indigo-500";
  if (p >= 30) return "from-sky-400 to-blue-500";
  if (p > 0) return "from-orange-400 to-amber-500";
  return "from-slate-300 to-slate-300";
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("All Tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [assigneeFilter, setAssigneeFilter] = useState("All Assignees");
  const [sortField, setSortField] = useState("dueDate");
  const [sortDir, setSortDir] = useState("asc");
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm] = Form.useForm();

  const allProjects = useMemo(
    () => [...new Set(tasks.map((t) => t.project.name))].sort(),
    [tasks]
  );
  const allAssignees = useMemo(
    () => [...new Set(tasks.map((t) => t.assignee.name))].sort(),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (activeTab === "Overdue") {
      result = result.filter(
        (t) => t.daysLeft < 0 && t.status !== "Completed"
      );
    } else if (activeTab === "Completed") {
      result = result.filter((t) => t.status === "Completed");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All Status") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== "All Priority") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (projectFilter !== "All Projects") {
      result = result.filter((t) => t.project.name === projectFilter);
    }

    if (assigneeFilter !== "All Assignees") {
      result = result.filter((t) => t.assignee.name === assigneeFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "dueDate":
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        case "priority": {
          const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
          cmp = order[a.priority] - order[b.priority];
          break;
        }
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [activeTab, searchQuery, statusFilter, priorityFilter, projectFilter, assigneeFilter, sortField, sortDir, tasks]);

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleViewTask = (task: Task) => {
    setViewTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    editForm.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
    });
  };

  const handleDeleteTask = (task: Task) => {
    Modal.confirm({
      title: "Delete Task",
      content: `Are you sure you want to delete ${task.title}?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => deleteTask(task.id),
      onCancel: () => {},
    });
  };

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const toDo = tasks.filter((t) => t.status === "To Do").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const overdue = tasks.filter((t) => t.daysLeft < 0 && t.status !== "Completed").length;

    const high = tasks.filter((t) => t.priority === "High").length;
    const medium = tasks.filter((t) => t.priority === "Medium").length;
    const low = tasks.filter((t) => t.priority === "Low").length;
    const totalPriority = high + medium + low;

    return {
      total, toDo, inProgress, completed, overdue,
      high, medium, low, totalPriority,
    };
  }, [tasks]);

  const safePct = (part: number, total: number) =>
    total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";

  const statCards = useMemo(
    () => [
      {
        label: "All Tasks",
        value: taskStats.total,
        change: "+12%",
        up: true,
        icon: ClipboardList,
        iconBg: "from-violet-100 to-violet-50 text-violet-600",
        line: "#8b5cf6",
        data: [12, 18, 14, 22, 20, 26, 24, 30, 28, 34, 32, 38],
      },
      {
        label: "To Do",
        value: taskStats.toDo,
        change: "+8%",
        up: true,
        icon: Clock,
        iconBg: "from-sky-100 to-sky-50 text-sky-600",
        line: "#0ea5e9",
        data: [8, 10, 9, 12, 14, 12, 15, 13, 16, 18, 17, 20],
      },
      {
        label: "In Progress",
        value: taskStats.inProgress,
        change: "+15%",
        up: true,
        icon: Hourglass,
        iconBg: "from-orange-100 to-amber-50 text-orange-500",
        line: "#f59e0b",
        data: [22, 25, 24, 28, 26, 30, 34, 32, 36, 40, 42, 45],
      },
      {
        label: "Completed",
        value: taskStats.completed,
        change: "+20%",
        up: true,
        icon: CheckCircle2,
        iconBg: "from-emerald-100 to-emerald-50 text-emerald-600",
        line: "#10b981",
        data: [10, 14, 12, 18, 20, 24, 22, 28, 30, 32, 36, 38],
      },
      {
        label: "Overdue",
        value: taskStats.overdue,
        change: "-5%",
        up: false,
        icon: AlertCircle,
        iconBg: "from-rose-100 to-red-50 text-rose-500",
        line: "#f43f5e",
        data: [14, 13, 15, 12, 14, 11, 13, 10, 12, 11, 10, 9],
      },
    ],
    [taskStats]
  );

  const statusSegments = useMemo(
    () => [
      { label: "To Do", value: taskStats.toDo, color: "#94a3b8", pct: safePct(taskStats.toDo, taskStats.total) },
      { label: "In Progress", value: taskStats.inProgress, color: "#3b82f6", pct: safePct(taskStats.inProgress, taskStats.total) },
      { label: "Completed", value: taskStats.completed, color: "#10b981", pct: safePct(taskStats.completed, taskStats.total) },
      { label: "Overdue", value: taskStats.overdue, color: "#ef4444", pct: safePct(taskStats.overdue, taskStats.total) },
    ],
    [taskStats]
  );

  const priorityBars = useMemo(
    () => [
      { label: "High", value: taskStats.high, pct: safePct(taskStats.high, taskStats.totalPriority), color: "from-rose-400 to-red-500" },
      { label: "Medium", value: taskStats.medium, pct: safePct(taskStats.medium, taskStats.totalPriority), color: "from-orange-400 to-amber-500" },
      { label: "Low", value: taskStats.low, pct: safePct(taskStats.low, taskStats.totalPriority), color: "from-emerald-400 to-emerald-500" },
    ],
    [taskStats]
  );

  return (
    <div className="fade-in text-slate-800">
      {/* Top bar */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize, prioritize and track all your tasks in one place.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Task
        </button>
      </div>

      {/* Filter bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6 md:items-end">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <FilterSelect
          label="Status"
          value={statusFilter}
          onSelect={(v) => setStatusFilter(v)}
          options={["All Status", "To Do", "In Progress", "Completed"]}
        />
        <FilterSelect
          label="Priority"
          value={priorityFilter}
          onSelect={(v) => setPriorityFilter(v)}
          options={["All Priority", "High", "Medium", "Low"]}
        />
        <FilterSelect
          label="Project"
          value={projectFilter}
          onSelect={(v) => setProjectFilter(v)}
          options={["All Projects", ...allProjects]}
        />
        <FilterSelect
          label="Assignee"
          value={assigneeFilter}
          onSelect={(v) => setAssigneeFilter(v)}
          options={["All Assignees", ...allAssignees]}
        />
        <div className="flex items-end gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
            <option value="progress">Sort by Progress</option>
          </select>
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            {sortDir === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl bg-white p-4 border border-slate-200/60 transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c.iconBg}`}>
                <c.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500">{c.label}</div>
                <div className="text-2xl font-bold leading-tight text-slate-800">{c.value}</div>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="flex items-center gap-1 text-xs">
                {c.up ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span className={c.up ? "font-semibold text-emerald-600" : "font-semibold text-rose-500"}>
                  {c.change}
                </span>
                <span className="text-slate-400">from last week</span>
              </div>
              <Sparkline data={c.data} color={c.line} />
            </div>
          </div>
        ))}
      </div>

      {/* Task table */}
      <div className="mt-6 flex flex-col gap-5">
        <TaskTable
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filteredTasks={filteredTasks}
          onViewTask={handleViewTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Tasks by Status">
            <div className="flex items-center gap-4">
              <DonutChart segments={statusSegments} total={taskStats.total} centerLabel="Total Tasks" />
              <div className="flex flex-1 flex-col gap-2.5 text-sm">
                {statusSegments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-600">{s.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-700">{s.value}</span>
                      <span className="ml-1.5 text-xs text-slate-400">({s.pct})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Tasks by Priority">
            <div className="flex flex-col gap-4">
              {priorityBars.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{p.label}</span>
                    <div>
                      <span className="font-semibold text-slate-800">{p.value}</span>
                      <span className="ml-1.5 text-xs text-slate-400">({p.pct})</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${p.color}`} style={{ width: p.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Upcoming Due Dates"
            action={<button className="text-xs font-medium text-violet-600 hover:underline">View All</button>}
          >
            <ul className="flex flex-col gap-3">
              {UPCOMING.map((u) => (
                <li key={u.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg text-xs ${u.color}`}>📌</span>
                    <div>
                      <div className="text-sm font-medium leading-tight text-slate-800">{u.title}</div>
                      <div className="text-xs text-slate-500">{u.date}</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{u.left}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={viewTask !== null}
        title={viewTask?.title || ""}
        footer={null}
        onCancel={() => setViewTask(null)}
      >
        {viewTask && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Description</div>
              <div className="text-sm text-slate-700">{viewTask.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Project</div>
                <div className="flex items-center gap-2">
                  <div className={`grid h-6 w-6 place-items-center rounded-md text-xs ${viewTask.project.color}`}>
                    {viewTask.project.icon}
                  </div>
                  <span className="text-sm text-slate-700">{viewTask.project.name}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Assignee</div>
                <div className="flex items-center gap-2">
                  <img
                    src={viewTask.assignee.avatar}
                    alt={viewTask.assignee.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span className="text-sm text-slate-700">{viewTask.assignee.name}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Status</div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_STYLE[viewTask.status]}`}>
                  {viewTask.status}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Priority</div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${PRIORITY_STYLE[viewTask.priority]}`}>
                  {viewTask.priority}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Due Date</div>
                <div className="text-sm text-slate-700">{viewTask.dueDate}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Progress</div>
                <div className="text-sm text-slate-700">{viewTask.progress}%</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={editTask !== null}
        title="Edit Task"
        okText="Save"
        cancelText="Cancel"
        onOk={() => {
          editForm.validateFields().then((values) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === editTask?.id ? { ...t, ...values } : t
              )
            );
            setEditTask(null);
            message.success("Task updated successfully");
          });
        }}
        onCancel={() => setEditTask(null)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please enter title" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "To Do", label: "To Do" },
                { value: "In Progress", label: "In Progress" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select
              options={[
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
              ]}
            />
          </Form.Item>
          <Form.Item name="progress" label="Progress">
            <Slider />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task table                                                         */
/* ------------------------------------------------------------------ */

function TaskTable({
  activeTab,
  onTabChange,
  filteredTasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  filteredTasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = filteredTasks.every((t) => checked[t.id]);
  const pageSize = 10;
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleToggleAll = useCallback(() => {
    if (allChecked) setChecked({});
    else setChecked(Object.fromEntries(filteredTasks.map((t) => [t.id, true])));
  }, [allChecked, filteredTasks]);

  const handleToggleRow = useCallback((id: string) => {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }, []);

  return (
    <div className="rounded-xl bg-white border border-slate-200">
      {/* Tabs */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-slate-200/70 px-5 pt-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={
              "relative whitespace-nowrap pb-3 text-sm font-medium transition " +
              (activeTab === t ? "text-violet-600" : "text-slate-500 hover:text-slate-700")
            }
          >
            {t}
            {activeTab === t && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-violet-600" />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-5 overflow-x-auto overflow-hidden rounded-b-xl perf-scroll">
        <table className="w-full border-separate border-spacing-y-1.5 perf-contain">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="rounded-l-xl bg-slate-50 px-5 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </th>
              <th className="bg-slate-50 px-4 py-3">Task</th>
              <th className="bg-slate-50 px-4 py-3">Project</th>
              <th className="bg-slate-50 px-4 py-3">Assignee</th>
              <th className="bg-slate-50 px-4 py-3">Status</th>
              <th className="bg-slate-50 px-4 py-3">Priority</th>
              <th className="bg-slate-50 px-4 py-3">Due Date</th>
              <th className="bg-slate-50 px-4 py-3">Progress</th>
              <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                checked={!!checked[t.id]}
                onToggle={handleToggleRow}
                onViewTask={onViewTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredTasks.length > pageSize && (
        <div className="px-5 pb-4 pt-2">
          <Pagination
            total={filteredTasks.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            totalLabel={`${filteredTasks.length} tasks`}
          />
        </div>
      )}
    </div>
  );
}

const TaskRow = memo(function TaskRow({
  task,
  checked,
  onToggle,
  onViewTask,
  onEditTask,
  onDeleteTask,
}: {
  task: Task;
  checked: boolean;
  onToggle: (id: string) => void;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const progressCls = progressColor(task.progress);
  return (
    <tr className="text-sm text-slate-700">
      <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(task.id)}
          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        />
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="font-semibold text-slate-800">{task.title}</div>
        <div className="text-xs text-slate-500">{task.description}</div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`grid h-7 w-7 place-items-center rounded-lg text-sm ${task.project.color}`}>
            {task.project.icon}
          </div>
          <span className="text-sm text-slate-700">{task.project.name}</span>
        </div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img
            src={task.assignee.avatar}
            alt={task.assignee.name}
            className="h-7 w-7 rounded-full object-cover"
          />
          <span className="text-sm text-slate-700">{task.assignee.name}</span>
        </div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_STYLE[task.status]}`}
        >
          {task.status}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${PRIORITY_STYLE[task.priority]}`}
        >
          {task.priority}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="text-sm text-slate-700">{task.dueDate}</div>
        <div
          className={
            "text-xs " +
            (task.status === "Completed"
              ? "text-emerald-500"
              : task.daysLeft <= 3
              ? "text-rose-500"
              : "text-slate-500")
          }
        >
          {task.status === "Completed" ? "Completed" : `${task.daysLeft} days left`}
        </div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full bg-gradient-to-r ${progressCls} transition-[width]`} style={{ width: `${task.progress}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-medium text-slate-600">{task.progress}%</span>
        </div>
      </td>
      <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100 relative">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setActionMenuOpen((v) => !v)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {actionMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 origin-top-right rounded-xl bg-white border border-slate-200 shadow-lg shadow-black/5 ring-1 ring-black/5 focus:outline-none z-10">
              <div className="py-1">
                <button onClick={() => { onViewTask(task); setActionMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-600">
                  View Details
                </button>
                <button onClick={() => { onEditTask(task); setActionMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-600">
                  Edit Task
                </button>
                <hr className="my-1 border-slate-100" />
                <button onClick={() => { onDeleteTask(task); setActionMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function FilterSelect({
  label,
  value,
  onSelect,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onSelect: (val: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 border border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */
/*  Inline SVG charts (no deps)                                        */
/* ------------------------------------------------------------------ */

function Sparkline({
  data,
  color,
  width = 90,
  height = 32,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const areaPath = `M0,${height} L${pts.join(" L")} L${width},${height} Z`;
  const gid = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DonutChart({
  segments,
  total,
  size = 150,
  thickness = 20,
  centerLabel = "Total",
}: {
  segments: { value: number; color: string; label: string }[];
  total: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((a, b) => a + b.value, 0);
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const length = (seg.value / sum) * circumference;
          const dashArray = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-slate-800">{total}</div>
        <div className="text-xs text-slate-500">{centerLabel}</div>
      </div>
    </div>
  );
}
