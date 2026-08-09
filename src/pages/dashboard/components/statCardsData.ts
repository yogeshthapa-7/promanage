export interface DashboardStatCardData {
  id: string;
  title: string;
  value: number;
  trend: string;
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
  iconType: 'folder' | 'clock' | 'check' | 'alert' | 'users' | 'dollar' | 'trending' | 'user-square' | 'building-2' | 'folder-open';
  sparklineData: number[];
  sparklineColor: string;
}

const sparkLine = (end: number, len = 7) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(Math.round((end / len) * (i + 1)));
  }
  arr[arr.length - 1] = end;
  return arr;
};

export function getStatCards(data: {
  projects: number;
  users: number;
  employees: number;
  departments: number;
  organizations: number;
  tasks: number;
}): DashboardStatCardData[] {
  const { projects, users, departments, organizations, tasks } = data;

  return [
    {
      id: 'stat-total-projects',
      title: 'Total Projects',
      value: projects,
      trend: projects > 0 ? `+${Math.round(projects * 0.08)}%` : '0%',
      trendUp: true,
      iconBg: '#F3F0FF',
      iconColor: '#7C3AED',
      iconType: 'folder',
      sparklineData: sparkLine(projects),
      sparklineColor: '#7C3AED',
    },
    {
      id: 'stat-users',
      title: 'Users',
      value: users,
      trend: users > 0 ? `+${Math.round(users * 0.05)}%` : '0%',
      trendUp: true,
      iconBg: '#EFF6FF',
      iconColor: '#3B82F6',
      iconType: 'users',
      sparklineData: sparkLine(users),
      sparklineColor: '#3B82F6',
    },
    {
      id: 'stat-organizations',
      title: 'Organizations',
      value: organizations,
      trend: organizations > 0 ? `+${Math.round(organizations * 0.03)}%` : '0%',
      trendUp: true,
      iconBg: '#F3F0FF',
      iconColor: '#8B5CF6',
      iconType: 'building-2',
      sparklineData: sparkLine(organizations),
      sparklineColor: '#8B5CF6',
    },
    {
      id: 'stat-departments',
      title: 'Departments',
      value: departments,
      trend: departments > 0 ? `+${Math.round(departments * 0.04)}%` : '0%',
      trendUp: true,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      iconType: 'user-square',
      sparklineData: sparkLine(departments),
      sparklineColor: '#10B981',
    },
    {
      id: 'stat-tasks',
      title: 'Tasks',
      value: tasks,
      trend: tasks > 0 ? `+${Math.round(tasks * 0.06)}%` : '0%',
      trendUp: true,
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      iconType: 'folder-open',
      sparklineData: sparkLine(tasks),
      sparklineColor: '#D97706',
    },
  ];
}