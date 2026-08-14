/* eslint-disable react-refresh/only-export-components -- page file exports data constant alongside component */
import Pagination from "@/components/ui/Pagination";
import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import Highcharts from "highcharts";
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Briefcase,
  TrendingUp,
  MoreHorizontal,
  MapPin,
  Shield,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Modal, Form, Input, Select, Slider, Upload, message } from "antd";
import DropdownMenu from "@/components/ui/DropdownMenu";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Drawer from "@/components/drawer";
import { usePaginatedList, type PaginatedListParams } from "@/hooks/usePaginatedList";

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
  const editAvatarFileRef = useRef<File | null>(null);
  const inviteAvatarFileRef = useRef<File | null>(null);

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

  const {
    data: paginatedMembers,
    total: totalFiltered,
    currentPage,
    setCurrentPage,
    refetch,
  } = usePaginatedList<TeamMember>({
    fetcher: (params: PaginatedListParams) => {
      const start = params.start as number;
      const length = params.length as number;
      const items = filteredMembers.slice(start, start + length);
      return { items, total: filteredMembers.length };
    },
    initialPageSize: 10,
    extraDeps: [filteredMembers],
  });

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    refetch();
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
          <p className="mt-1 text-base text-slate-500">
            Manage your workspace members, roles, departments, and capacity allocations.
          </p>
        </div>

        <Button type="primary" onClick={() => setShowInviteModal(true)} icon={<UserPlus className="h-4 w-4" strokeWidth={2.5} />}>
          Add Member
        </Button>
      </div>
      <hr className="border-slate-200 my-6" />

      {/* Filter and Control Bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search member or email..."
          containerClassName="md:col-span-1"
        />
        <Select
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'All Roles', label: 'All Roles' },
            { value: 'Admin', label: 'Admin' },
            { value: 'Member', label: 'Member' },
            { value: 'Guest', label: 'Guest' },
          ]}
          className="w-full"
        />
        <Select
          label="Department"
          value={deptFilter}
          onChange={setDeptFilter}
          options={[
            { value: 'All Departments', label: 'All Departments' },
            ...allDepartments.map((d) => ({ value: d, label: d })),
          ]}
          className="w-full"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'All Status', label: 'All Status' },
            { value: 'Active', label: 'Active' },
            { value: 'Away', label: 'Away' },
            { value: 'On Leave', label: 'On Leave' },
          ]}
          className="w-full"
        />
        <div className="flex items-end gap-2">
          <Select
            value={sortField}
            onChange={setSortField}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'role', label: 'Sort by Role' },
              { value: 'department', label: 'Sort by Department' },
              { value: 'workload', label: 'Sort by Workload' },
            ]}
            className="flex-1"
          />
          <Button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            icon={sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((c) => (
          <StatCard
            key={c.label}
            title={c.label}
            value={c.value}
            trend={c.change}
            trendUp={c.up}
            iconBg={c.iconBg.replace('from-', 'from-').replace('to-', 'to-').includes('violet') ? '#F3F0FF' : '#F3F0FF'}
            iconColor="#7C3AED"
            icon={<c.icon className="h-5 w-5" strokeWidth={2.2} />}
            sparklineData={c.data}
            sparklineColor={c.line}
          />
        ))}
      </div>

      {/* Main Table */}
      <div className="mt-6">
        <MemberTable
          activeTab={activeTab}
          onTabChange={setActiveTab}
          paginatedMembers={paginatedMembers}
          totalFiltered={totalFiltered}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
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
                <span className="text-sm font-medium text-slate-400">{members.length} Active Total</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6 flex justify-center">
                  <div ref={deptChartRef} className="w-full" />
                </div>
                <div className="sm:col-span-6 flex flex-col gap-2.5 text-sm">
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

            <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
              <strong>Department Distribution:</strong> Engineering represents the largest segment with high technical focus. Resource availability remains balanced across all active operations.
            </div>
          </div>

          {/* Card 2: Team Performance */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 h-full">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Team Performance</h3>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <TrendingUp className="h-3 w-3" /> +14% QoQ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6 flex justify-center">
                  <div ref={perfChartRef} className="w-full" />
                </div>
                <div className="sm:col-span-6 flex flex-col gap-3">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <div className="text-base text-slate-500 font-medium">Sprint Delivery Rate</div>
                    <div className="text-lg font-bold text-slate-800">92.4%</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <div className="text-base text-slate-500 font-medium">Avg Completion Speed</div>
                    <div className="text-lg font-bold text-slate-800">3.2 Days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
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
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-sm font-bold text-rose-600 border border-rose-200/60">
                    {employeesOnLeave.length}
                  </span>
                </div>
                <button className="text-sm font-medium text-violet-600 hover:underline">Leave Calendar</button>
              </div>

              {employeesOnLeave.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-slate-700">All team members are present!</p>
                  <p className="text-base text-slate-400">No active leave requests for today.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {employeesOnLeave.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                       <div className="flex items-center gap-3 min-w-0 flex-1">
                         <img
                           src={emp.avatar}
                           alt={emp.name}
                           className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-100 shrink-0"
                         />
                         <div className="min-w-0 flex-1 truncate">
                           <div className="text-sm font-semibold text-slate-800 truncate">{emp.name}</div>
                           <div className="text-base text-slate-500 truncate">{emp.title}</div>
                         </div>
                       </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                          <Calendar className="h-3 w-3" />
                          {emp.leaveDetails?.startDate} - {emp.leaveDetails?.endDate}
                        </div>
                        <div className="mt-0.5 text-base text-slate-400">{emp.leaveDetails?.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
              <strong>Leave Overview:</strong> Staff availability is automatically calculated into workload allocations. Ensure coverage for assigned active projects before approval.
            </div>
          </div>

          {/* Card 2: Workload Distribution */}
          <div className="flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 h-full">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Workload Distribution</h3>
                <span className="text-sm font-medium text-slate-400">Capacity Breakdown</span>
              </div>

              <div className="flex flex-col gap-3.5">
                {members.slice(0, 4).map((m) => (
                   <div key={m.id}>
                     <div className="flex items-center justify-between text-sm mb-1">
                       <span className="font-semibold text-slate-700 truncate">{m.name}</span>
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

            <div className="mt-4 pt-3 border-t border-slate-100 text-base text-slate-500 leading-relaxed">
              <strong>Capacity Summary:</strong> Team members with workloads over 85% are operating near maximum bandwidth. Reassign pending tasks to avoid bottlenecking upcoming sprints.
            </div>
          </div>
        </div>
      </div>

      {/* Drawer: View Details */}
      <Drawer
        open={viewMember !== null}
        onClose={() => setViewMember(null)}
        title={viewMember?.name || ""}
        width={420}
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
                <p className="text-base text-slate-500">{viewMember.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold border ${ROLE_STYLE[viewMember.role]}`}>
                    {viewMember.role}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold border ${STATUS_STYLE[viewMember.status]}`}>
                    {viewMember.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <div className="text-sm font-medium text-slate-500 mb-0.5">Email</div>
                <div className="text-sm text-slate-700 font-medium">{viewMember.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 mb-0.5">Department</div>
                <div className="text-sm text-slate-700">{viewMember.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 mb-0.5">Location</div>
                <div className="text-sm text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {viewMember.location}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 mb-0.5">Workload Capacity</div>
                <div className="text-sm text-slate-700 font-semibold">{viewMember.workload}%</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-sm font-medium text-slate-500 mb-1.5">Skills & Expertise</div>
              <div className="flex flex-wrap gap-1.5">
                {viewMember.skills.map((skill, i) => (
                  <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-sm font-medium text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Drawer: Edit Member */}
      <Drawer
        open={editMember !== null}
        onClose={() => setEditMember(null)}
        title="Edit Team Member"
        width={480}
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
          <Form.Item
            name="profilePhoto"
            label="Profile Photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
          >
            <Upload
              accept="image/*"
              listType="picture"
              beforeUpload={() => false}
              maxCount={1}
              onChange={(info) => {
                editAvatarFileRef.current =
                  info.fileList.length > 0 && info.fileList[0].originFileObj
                    ? info.fileList[0].originFileObj
                    : null;
              }}
            >
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Choose Photo
              </button>
            </Upload>
          </Form.Item>
        </Form>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <Button onClick={() => setEditMember(null)}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => {
              editForm.validateFields().then((values) => {
                const avatarUrl = editAvatarFileRef.current
                  ? URL.createObjectURL(editAvatarFileRef.current)
                  : editMember!.avatar;
                setMembers((prev) =>
                  prev.map((m) =>
                    m.id === editMember?.id ? { ...m, ...values, avatar: avatarUrl } : m
                  )
                );
                setEditMember(null);
                editAvatarFileRef.current = null;
                message.success("Member updated successfully");
              });
            }}
          >
            Save Changes
          </Button>
        </div>
      </Drawer>

      {/* Drawer: Invite Member */}
      <Drawer
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Add New Team Member"
        width={480}
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
          <Form.Item
            name="profilePhoto"
            label="Profile Photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
          >
            <Upload
              accept="image/*"
              listType="picture"
              beforeUpload={() => false}
              maxCount={1}
              onChange={(info) => {
                inviteAvatarFileRef.current =
                  info.fileList.length > 0 && info.fileList[0].originFileObj
                    ? info.fileList[0].originFileObj
                    : null;
              }}
            >
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Choose Photo
              </button>
            </Upload>
          </Form.Item>
        </Form>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <Button onClick={() => setShowInviteModal(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => {
              inviteForm.validateFields().then((values) => {
                const avatarUrl = inviteAvatarFileRef.current
                  ? URL.createObjectURL(inviteAvatarFileRef.current)
                  : `https://i.pravatar.cc/64?img=${Math.floor(Math.random() * 50)}`;
                const newMember: TeamMember = {
                  id: Date.now().toString(),
                  name: values.name,
                  email: values.email,
                  role: values.role || "Member",
                  title: values.title || "Team Member",
                  department: values.department || "General",
                  avatar: avatarUrl,
                  status: "Active",
                  workload: 0,
                  location: "Remote",
                  projectsCount: 0,
                  skills: ["Onboarding"],
                };
                setMembers((prev) => [newMember, ...prev]);
                setShowInviteModal(false);
                inviteForm.resetFields();
                inviteAvatarFileRef.current = null;
                message.success("Invitation sent successfully");
              });
            }}
          >
            Create Member
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

/* Data Directory Component */
function MemberTable({
  activeTab,
  onTabChange,
  paginatedMembers,
  totalFiltered,
  currentPage,
  onPageChange,
  onViewMember,
  onEditMember,
  onDeleteMember,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  paginatedMembers: TeamMember[];
  totalFiltered: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewMember: (member: TeamMember) => void;
  onEditMember: (member: TeamMember) => void;
  onDeleteMember: (member: TeamMember) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = paginatedMembers.length > 0 && paginatedMembers.every((m) => checked[m.id]);

  const handleToggleAll = useCallback(() => {
    if (allChecked) setChecked({});
    else setChecked(Object.fromEntries(paginatedMembers.map((m) => [m.id, true])));
  }, [allChecked, paginatedMembers]);

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

      <div className="mt-5 overflow-x-auto overflow-y-visible rounded-b-xl">
        <table className="w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
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

      {totalFiltered > 0 && (
        <div className="px-5 pb-4 pt-2">
          <Pagination
            total={totalFiltered}
            currentPage={currentPage}
            pageSize={10}
            onPageChange={onPageChange}
            totalLabel={`${totalFiltered} members`}
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
            <div className="text-base text-slate-500">{member.email}</div>
          </div>
        </div>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium border ${ROLE_STYLE[member.role]}`}
        >
          {member.role}
        </span>
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
        {member.department}
      </td>
      <td className="bg-white px-4 py-3 border-b border-slate-100">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium border ${STATUS_STYLE[member.status]}`}
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
          <span className="w-8 text-right text-sm font-semibold text-slate-600">{member.workload}%</span>
        </div>
      </td>
      <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
        <DropdownMenu
          trigger={
            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            { label: "View Profile", onClick: () => onViewMember(member) },
            { label: "Edit Role", onClick: () => onEditMember(member) },
            { label: "Remove Member", onClick: () => onDeleteMember(member), danger: true },
          ]}
        />
      </td>
    </tr>
  );
});

