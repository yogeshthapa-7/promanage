import Pagination from "@/components/ui/Pagination";
import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import Highcharts from "highcharts";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Briefcase,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  MapPin,
  Shield,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Modal, Form, Input, Select, Slider, message } from "antd";

type MemberRole = "Admin" | "Member" | "Guest";
type MemberStatus = "Active" | "Away" | "On Leave";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  title: string;
  department: string;
  avatar: string;
  status: MemberStatus;
  workload: number; // percentage
  location: string;
  projectsCount: number;
  skills: string[];
  leaveDetails?: {
    reason: string;
    startDate: string;
    endDate: string;
  };
}

export const MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Anisha Gurung",
    email: "anisha.g@promanage.io",
    role: "Admin",
    title: "Lead UI/UX Designer",
    department: "Design",
    avatar: "https://i.pravatar.cc/64?img=47",
    status: "Active",
    workload: 85,
    location: "Kathmandu, Nepal",
    projectsCount: 3,
    skills: ["Figma", "Tailwind CSS", "UX Research"],
  },
  {
    id: "2",
    name: "Prabin Thapa",
    email: "prabin.t@promanage.io",
    role: "Member",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    avatar: "https://i.pravatar.cc/64?img=12",
    status: "Active",
    workload: 45,
    location: "Lalitpur, Nepal",
    projectsCount: 2,
    skills: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "3",
    name: "Sagar Tamang",
    email: "sagar.t@promanage.io",
    role: "Member",
    title: "Backend Architect",
    department: "Engineering",
    avatar: "https://i.pravatar.cc/64?img=15",
    status: "Away",
    workload: 95,
    location: "Pokhara, Nepal",
    projectsCount: 4,
    skills: ["Node.js", "PostgreSQL", "Docker"],
  },
  {
    id: "4",
    name: "Rita Shrestha",
    email: "rita.s@promanage.io",
    role: "Member",
    title: "Marketing Lead",
    department: "Marketing",
    avatar: "https://i.pravatar.cc/64?img=45",
    status: "On Leave",
    workload: 0,
    location: "Kathmandu, Nepal",
    projectsCount: 1,
    skills: ["SEO", "Content Strategy", "Analytics"],
    leaveDetails: {
      reason: "Annual Vacation",
      startDate: "Jul 28",
      endDate: "Aug 05",
    },
  },
  {
    id: "5",
    name: "Kathmandu Shikshalaya",
    email: "contact@ks.edu.np",
    role: "Guest",
    title: "External QA Consultant",
    department: "Quality Assurance",
    avatar: "https://i.pravatar.cc/64?img=33",
    status: "On Leave",
    workload: 10,
    location: "Bhaktapur, Nepal",
    projectsCount: 1,
    skills: ["Manual Testing", "Cypress", "Automation"],
    leaveDetails: {
      reason: "Sick Leave",
      startDate: "Jul 30",
      endDate: "Aug 02",
    },
  },
];

const TABS = ["All Members", "Admins", "Guests"];

const STATUS_STYLE: Record<MemberStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  Away: "bg-amber-50 text-amber-600 border-amber-200/60",
  "On Leave": "bg-rose-50 text-rose-600 border-rose-200/60",
};

const ROLE_STYLE: Record<MemberRole, string> = {
  Admin: "bg-violet-50 text-violet-600 border-violet-200/60",
  Member: "bg-sky-50 text-sky-600 border-sky-200/60",
  Guest: "bg-slate-50 text-slate-600 border-slate-200/60",
};

const workloadColor = (w: number) => {
  if (w >= 90) return "from-rose-400 to-red-500";
  if (w >= 60) return "from-violet-400 to-indigo-500";
  if (w >= 30) return "from-sky-400 to-blue-500";
  return "from-emerald-400 to-emerald-500";
};

export default function TeamMembersPage() {
  const [activeTab, setActiveTab] = useState("All Members");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const [members, setMembers] = useState<TeamMember[]>(MEMBERS);
  const [viewMember, setViewMember] = useState<TeamMember | null>(null);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [editForm] = Form.useForm();
  const [inviteForm] = Form.useForm();

  const allDepartments = useMemo(
    () => [...new Set(members.map((m) => m.department))].sort(),
    [members]
  );

  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (activeTab === "Admins") {
      result = result.filter((m) => m.role === "Admin");
    } else if (activeTab === "Guests") {
      result = result.filter((m) => m.role === "Guest");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "All Roles") {
      result = result.filter((m) => m.role === roleFilter);
    }

    if (deptFilter !== "All Departments") {
      result = result.filter((m) => m.department === deptFilter);
    }

    if (statusFilter !== "All Status") {
      result = result.filter((m) => m.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "department":
          cmp = a.department.localeCompare(b.department);
          break;
        case "workload":
          cmp = a.workload - b.workload;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [activeTab, searchQuery, roleFilter, deptFilter, statusFilter, sortField, sortDir, members]);

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleEditMember = (member: TeamMember) => {
    setEditMember(member);
    editForm.setFieldsValue({
      name: member.name,
      title: member.title,
      department: member.department,
      role: member.role,
      status: member.status,
      workload: member.workload,
    });
  };

  const handleDeleteMember = (member: TeamMember) => {
    Modal.confirm({
      title: "Remove Team Member",
      content: `Are you sure you want to remove ${member.name} from the workspace?`,
      okText: "Remove",
      okType: "danger",
      onOk: () => deleteMember(member.id),
    });
  };

  const memberStats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const away = members.filter((m) => m.status === "Away").length;
    const onLeave = members.filter((m) => m.status === "On Leave").length;
    const admins = members.filter((m) => m.role === "Admin").length;

    const avgWorkload =
      total > 0 ? Math.round(members.reduce((acc, m) => acc + m.workload, 0) / total) : 0;

    return { total, active, away, onLeave, admins, avgWorkload };
  }, [members]);

  const safePct = (part: number, total: number) =>
    total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";

  const statCards = useMemo(
    () => [
      {
        label: "Total Members",
        value: memberStats.total,
        change: "+2",
        up: true,
        icon: Users,
        iconBg: "from-violet-100 to-violet-50 text-violet-600",
        line: "#8b5cf6",
        data: [3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, memberStats.total],
      },
      {
        label: "Active Now",
        value: memberStats.active,
        change: "+12%",
        up: true,
        icon: UserCheck,
        iconBg: "from-emerald-100 to-emerald-50 text-emerald-600",
        line: "#10b981",
        data: [2, 3, 3, 4, 4, 5, 4, 5, 6, 5, 6, memberStats.active],
      },
      {
        label: "Workspace Admins",
        value: memberStats.admins,
        change: "0%",
        up: true,
        icon: Shield,
        iconBg: "from-sky-100 to-sky-50 text-sky-600",
        line: "#0ea5e9",
        data: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, memberStats.admins],
      },
      {
        label: "Avg Workload",
        value: `${memberStats.avgWorkload}%`,
        change: "+5%",
        up: true,
        icon: Briefcase,
        iconBg: "from-orange-100 to-amber-50 text-orange-500",
        line: "#f59e0b",
        data: [40, 45, 50, 52, 58, 60, 62, 65, 63, 68, 70, memberStats.avgWorkload],
      },
      {
        label: "On Leave / Away",
        value: memberStats.away + memberStats.onLeave,
        change: "-1",
        up: false,
        icon: Clock,
        iconBg: "from-rose-100 to-red-50 text-rose-500",
        line: "#f43f5e",
        data: [1, 2, 1, 3, 2, 1, 2, 1, 2, 1, 2, memberStats.away + memberStats.onLeave],
      },
    ],
    [memberStats]
  );

  // Highcharts Refs
  const deptChartRef = useRef<HTMLDivElement>(null);
  const perfChartRef = useRef<HTMLDivElement>(null);

  const deptSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      counts[m.department] = (counts[m.department] || 0) + 1;
    });
    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];
    return Object.keys(counts).map((dept, i) => ({
      label: dept,
      value: counts[dept],
      color: colors[i % colors.length],
      pct: safePct(counts[dept], members.length),
    }));
  }, [members]);

  const employeesOnLeave = useMemo(
    () => members.filter((m) => m.status === "On Leave"),
    [members]
  );

  // Render Highchart for Department
  useEffect(() => {
    if (deptChartRef.current) {
      Highcharts.chart(deptChartRef.current, {
        chart: {
          type: "pie",
          height: 170,
          backgroundColor: "transparent",
          style: { fontFamily: "inherit" },
        },
        title: { text: undefined },
        tooltip: { pointFormat: "<b>{point.y}</b> ({point.percentage:.1f}%)" },
        plotOptions: {
          pie: {
            innerSize: "68%",
            dataLabels: { enabled: false },
            showInLegend: false,
            borderWidth: 0,
          },
        },
        series: [
          {
            type: "pie",
            data: deptSegments.map((s) => ({
              name: s.label,
              y: s.value,
              color: s.color,
            })),
          },
        ],
      });
    }
  }, [deptSegments]);

  // Render Highchart for Performance
  useEffect(() => {
    if (perfChartRef.current) {
      Highcharts.chart(perfChartRef.current, {
        chart: {
          type: "column",
          height: 170,
          backgroundColor: "transparent",
          style: { fontFamily: "inherit" },
        },
        title: { text: undefined },
        xAxis: {
          categories: ["Q1", "Q2", "Q3", "Q4"],
          labels: { style: { color: "#94a3b8", fontSize: "11px" } },
          lineWidth: 0,
          tickWidth: 0,
        },
        yAxis: {
          visible: false,
        },
        legend: { enabled: false },
        tooltip: { pointFormat: "<b>{point.y}% Output</b>" },
        plotOptions: {
          column: {
            borderRadius: 6,
            borderWidth: 0,
            pointWidth: 18,
          },
        },
        series: [
          {
            type: "column",
            data: [
              { y: 78, color: "#cbd5e1" },
              { y: 85, color: "#cbd5e1" },
              { y: 92, color: "#8b5cf6" },
              { y: 88, color: "#a78bfa" },
            ],
          },
        ],
      });
    }
  }, []);

  return (
    <div className="fade-in text-slate-800">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Team Members</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your workspace members, roles, departments, and capacity allocations.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-sm"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.5} />
          Add Member
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search member or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <FilterSelect
          label="Role"
          value={roleFilter}
          onSelect={setRoleFilter}
          options={["All Roles", "Admin", "Member", "Guest"]}
        />
        <FilterSelect
          label="Department"
          value={deptFilter}
          onSelect={setDeptFilter}
          options={["All Departments", ...allDepartments]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onSelect={setStatusFilter}
          options={["All Status", "Active", "Away", "On Leave"]}
        />
        <div className="flex items-end gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
            <option value="department">Sort by Department</option>
            <option value="workload">Sort by Workload</option>
          </select>
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            {sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
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
                <span className="text-slate-400">vs last month</span>
              </div>
              <Sparkline data={c.data} color={c.line} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="mt-6">
        <MemberTable
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filteredMembers={filteredMembers}
          onViewMember={setViewMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
        />
      </div>

      {/* Custom Bottom Layout */}
      <div className="mt-6 flex flex-col gap-6">
        {/* ROW 1: 2 Equal Cards (Members by Dept & Team Performance) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
          {/* Card 1: Members by Department */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 h-full">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Members by Department</h3>
                <span className="text-xs font-medium text-slate-400">{members.length} Active Total</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6 flex justify-center">
                  <div ref={deptChartRef} className="w-full" />
                </div>
                <div className="sm:col-span-6 flex flex-col gap-2.5 text-xs">
                  {deptSegments.map((s) => (
                    <div key={s.label} className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-slate-600 font-medium">{s.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">{s.value}</span>
                        <span className="ml-1 text-slate-400">({s.pct})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              <strong>Department Distribution:</strong> Engineering represents the largest segment with high technical focus. Resource availability remains balanced across all active operations.
            </div>
          </div>

          {/* Card 2: Team Performance */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 h-full">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Team Performance</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <TrendingUp className="h-3 w-3" /> +14% QoQ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6 flex justify-center">
                  <div ref={perfChartRef} className="w-full" />
                </div>
                <div className="sm:col-span-6 flex flex-col gap-3">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">Sprint Delivery Rate</div>
                    <div className="text-lg font-bold text-slate-800">92.4%</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">Avg Completion Speed</div>
                    <div className="text-lg font-bold text-slate-800">3.2 Days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              <strong>Performance Metric:</strong> Output efficiency has peaked in Q3. Delivery speed improved by 0.5 days on average following recent workflow automation setups.
            </div>
          </div>
        </div>

        {/* ROW 2: 2 Cards (Employees on Leave & Workload Distribution) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
          {/* Card 1: Employees on Leave */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 h-full">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-800">Employees on Leave</h3>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-200/60">
                    {employeesOnLeave.length}
                  </span>
                </div>
                <button className="text-xs font-medium text-violet-600 hover:underline">Leave Calendar</button>
              </div>

              {employeesOnLeave.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-slate-700">All team members are present!</p>
                  <p className="text-xs text-slate-400">No active leave requests for today.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {employeesOnLeave.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-100"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{emp.name}</div>
                          <div className="text-xs text-slate-500">{emp.title}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                          <Calendar className="h-3 w-3" />
                          {emp.leaveDetails?.startDate} - {emp.leaveDetails?.endDate}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{emp.leaveDetails?.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              <strong>Leave Overview:</strong> Staff availability is automatically calculated into workload allocations. Ensure coverage for assigned active projects before approval.
            </div>
          </div>

          {/* Card 2: Workload Distribution */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 h-full">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Workload Distribution</h3>
                <span className="text-xs font-medium text-slate-400">Capacity Breakdown</span>
              </div>

              <div className="flex flex-col gap-3.5">
                {members.slice(0, 4).map((m) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{m.name}</span>
                      <span className="font-bold text-slate-800">{m.workload}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${workloadColor(m.workload)}`}
                        style={{ width: `${m.workload}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              <strong>Capacity Summary:</strong> Team members with workloads over 85% are operating near maximum bandwidth. Reassign pending tasks to avoid bottlenecking upcoming sprints.
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Details */}
      <Modal
        open={viewMember !== null}
        title={viewMember?.name || ""}
        footer={null}
        onCancel={() => setViewMember(null)}
      >
        {viewMember && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <img
                src={viewMember.avatar}
                alt={viewMember.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-violet-100"
              />
              <div>
                <h3 className="text-base font-bold text-slate-800">{viewMember.name}</h3>
                <p className="text-xs text-slate-500">{viewMember.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border ${ROLE_STYLE[viewMember.role]}`}>
                    {viewMember.role}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border ${STATUS_STYLE[viewMember.status]}`}>
                    {viewMember.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-0.5">Email</div>
                <div className="text-sm text-slate-700 font-medium">{viewMember.email}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-0.5">Department</div>
                <div className="text-sm text-slate-700">{viewMember.department}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-0.5">Location</div>
                <div className="text-sm text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {viewMember.location}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-0.5">Workload Capacity</div>
                <div className="text-sm text-slate-700 font-semibold">{viewMember.workload}%</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 mb-1.5">Skills & Expertise</div>
              <div className="flex flex-wrap gap-1.5">
                {viewMember.skills.map((skill, i) => (
                  <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Member */}
      <Modal
        open={editMember !== null}
        title="Edit Team Member"
        okText="Save Changes"
        cancelText="Cancel"
        onOk={() => {
          editForm.validateFields().then((values) => {
            setMembers((prev) =>
              prev.map((m) => (m.id === editMember?.id ? { ...m, ...values } : m))
            );
            setEditMember(null);
            message.success("Member updated successfully");
          });
        }}
        onCancel={() => setEditMember(null)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Job Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="System Role">
            <Select
              options={[
                { value: "Admin", label: "Admin" },
                { value: "Member", label: "Member" },
                { value: "Guest", label: "Guest" },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "Active", label: "Active" },
                { value: "Away", label: "Away" },
                { value: "On Leave", label: "On Leave" },
              ]}
            />
          </Form.Item>
          <Form.Item name="workload" label="Workload Capacity (%)">
            <Slider />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Invite Member */}
      <Modal
        open={showInviteModal}
        title="Add New Team Member"
        okText="Send Invitation"
        cancelText="Cancel"
        onOk={() => {
          inviteForm.validateFields().then((values) => {
            const newMember: TeamMember = {
              id: Date.now().toString(),
              name: values.name,
              email: values.email,
              role: values.role || "Member",
              title: values.title || "Team Member",
              department: values.department || "General",
              avatar: `https://i.pravatar.cc/64?img=${Math.floor(Math.random() * 50)}`,
              status: "Active",
              workload: 0,
              location: "Remote",
              projectsCount: 0,
              skills: ["Onboarding"],
            };
            setMembers((prev) => [newMember, ...prev]);
            setShowInviteModal(false);
            inviteForm.resetFields();
            message.success("Invitation sent successfully");
          });
        }}
        onCancel={() => setShowInviteModal(false)}
      >
        <Form form={inviteForm} layout="vertical">
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter full name" }]}>
            <Input placeholder="e.g. Alex Rivera" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}>
            <Input placeholder="alex.rivera@company.com" />
          </Form.Item>
          <Form.Item name="title" label="Job Title">
            <Input placeholder="e.g. Senior Developer" />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="e.g. Engineering" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="Member">
            <Select
              options={[
                { value: "Admin", label: "Admin" },
                { value: "Member", label: "Member" },
                { value: "Guest", label: "Guest" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* Data Directory Component */
function MemberTable({
  activeTab,
  onTabChange,
  filteredMembers,
  onViewMember,
  onEditMember,
  onDeleteMember,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  filteredMembers: TeamMember[];
  onViewMember: (member: TeamMember) => void;
  onEditMember: (member: TeamMember) => void;
  onDeleteMember: (member: TeamMember) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = filteredMembers.length > 0 && filteredMembers.every((m) => checked[m.id]);
  const pageSize = 10;
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleToggleAll = useCallback(() => {
    if (allChecked) setChecked({});
    else setChecked(Object.fromEntries(filteredMembers.map((m) => [m.id, true])));
  }, [allChecked, filteredMembers]);

  const handleToggleRow = useCallback((id: string) => {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }, []);

  return (
    <div className="rounded-xl bg-white border border-slate-200">
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

      <div className="mt-5 overflow-x-auto overflow-hidden rounded-b-xl">
        <table className="w-full border-separate border-spacing-y-1.5">
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
              <th className="bg-slate-50 px-4 py-3">Member</th>
              <th className="bg-slate-50 px-4 py-3">Role</th>
              <th className="bg-slate-50 px-4 py-3">Department</th>
              <th className="bg-slate-50 px-4 py-3">Status</th>
              <th className="bg-slate-50 px-4 py-3">Projects</th>
              <th className="bg-slate-50 px-4 py-3">Workload</th>
              <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                checked={!!checked[m.id]}
                onToggle={handleToggleRow}
                onViewMember={onViewMember}
                onEditMember={onEditMember}
                onDeleteMember={onDeleteMember}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length > pageSize && (
        <div className="px-5 pb-4 pt-2">
          <Pagination
            total={filteredMembers.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            totalLabel={`${filteredMembers.length} members`}
          />
        </div>
      )}
    </div>
  );
}

const MemberRow = memo(function MemberRow({
  member,
  checked,
  onToggle,
  onViewMember,
  onEditMember,
  onDeleteMember,
}: {
  member: TeamMember;
  checked: boolean;
  onToggle: (id: string) => void;
  onViewMember: (m: TeamMember) => void;
  onEditMember: (m: TeamMember) => void;
  onDeleteMember: (m: TeamMember) => void;
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const colorCls = workloadColor(member.workload);

  return (
    <tr className="text-sm text-slate-700">
      <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(member.id)}
          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        />
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={member.avatar}
            alt={member.name}
            className="h-8 w-8 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-slate-800">{member.name}</div>
            <div className="text-xs text-slate-500">{member.email}</div>
          </div>
        </div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${ROLE_STYLE[member.role]}`}
        >
          {member.role}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
        {member.department}
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_STYLE[member.status]}`}
        >
          {member.status}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
        {member.projectsCount} Active
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colorCls}`}
              style={{ width: `${member.workload}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-slate-600">{member.workload}%</span>
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
                <button
                  onClick={() => { onViewMember(member); setActionMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  View Profile
                </button>
                <button
                  onClick={() => { onEditMember(member); setActionMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  Edit Role
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={() => { onDeleteMember(member); setActionMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50"
                >
                  Remove Member
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

function FilterSelect({
  label,
  value,
  onSelect,
  options,
}: {
  label: string;
  value: string;
  onSelect: (val: string) => void;
  options: string[];
}) {
  return (
    <div>
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