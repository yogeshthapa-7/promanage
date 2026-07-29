import { type Project } from '@/lib/projects-data';

interface StatCardData {
  id: string;
  title: string;
  value: number;
  trend: string;
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
  iconType: 'folder' | 'clock' | 'check' | 'alert' | 'users';
  sparklineData: number[];
  sparklineColor: string;
}

export function getStatCards(projects: Project[]): StatCardData[] {
  const totalProjects = projects.length;
  const inProgress = projects.filter((p) => p.status === 'In Progress').length;
  const completed = projects.filter((p) => p.status === 'Completed').length;
  const overdue = projects.filter((p) => p.status === 'Overdue').length;
  const teamMemberIds = new Set(projects.flatMap((p) => p.team.map((m) => m.id)));
  const teamMembers = teamMemberIds.size;

  const sparkLine = (end: number, len = 7) => {
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(Math.round((end / len) * (i + 1)));
    }
    arr[arr.length - 1] = end;
    return arr;
  };

  return [
    {
      id: 'stat-total-projects',
      title: 'Total Projects',
      value: totalProjects,
      trend: `+${Math.round(totalProjects * 0.08)}%`,
      trendUp: true,
      iconBg: '#F3F0FF',
      iconColor: '#7C3AED',
      iconType: 'folder',
      sparklineData: sparkLine(totalProjects),
      sparklineColor: '#7C3AED',
    },
    {
      id: 'stat-in-progress',
      title: 'In Progress',
      value: inProgress,
      trend: `+${Math.round(inProgress * 0.1)}%`,
      trendUp: true,
      iconBg: '#EFF6FF',
      iconColor: '#3B82F6',
      iconType: 'clock',
      sparklineData: sparkLine(inProgress),
      sparklineColor: '#3B82F6',
    },
    {
      id: 'stat-completed',
      title: 'Completed',
      value: completed,
      trend: `+${Math.round(completed * 0.15)}%`,
      trendUp: true,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      iconType: 'check',
      sparklineData: sparkLine(completed),
      sparklineColor: '#10B981',
    },
    {
      id: 'stat-overdue',
      title: 'Overdue',
      value: overdue,
      trend: `${overdue > 0 ? '-' : ''}${Math.abs(overdue)}%`,
      trendUp: overdue === 0,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      iconType: 'alert',
      sparklineData: sparkLine(overdue),
      sparklineColor: '#EF4444',
    },
    {
      id: 'stat-team',
      title: 'Team Members',
      value: teamMembers,
      trend: `+${Math.round(teamMembers * 0.05)}%`,
      trendUp: true,
      iconBg: '#F3F0FF',
      iconColor: '#8B5CF6',
      iconType: 'users',
      sparklineData: sparkLine(teamMembers),
      sparklineColor: '#8B5CF6',
    },
  ];
}