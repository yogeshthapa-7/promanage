export interface BackgroundProps {
  className?: string;
}

export interface EntitySummaryCardProps {
  title: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href: string;
  loading?: boolean;
}

export interface ProjectOverviewSectionProps {
  projects: Project[];
  loading?: boolean;
}

export interface ProjectsTableProps {
  projects?: Project[];
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  filterStatus?: ProjectStatus | 'All';
  onFilterChange?: (status: ProjectStatus | 'All') => void;
  loading?: boolean;
}

export interface RecentProjectsCardProps {
  projects: Project[];
  loading?: boolean;
}

export interface StatCardClientProps {
  title: string;
  value: number;
  trend: string;
  trendUp: boolean;
  iconBg?: string;
  iconColor?: string;
  iconType?: 'folder' | 'clock' | 'check' | 'alert' | 'users' | 'dollar' | 'trending' | 'user-square' | 'building-2' | 'folder-open';
  sparklineData?: number[];
  sparklineColor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export interface StatCardsRowProps {
  projects?: Project[];
  stats?: {
    projects: number;
    users: number;
    employees: number;
    departments: number;
    organizations: number;
    tasks: number;
  };
  loading?: boolean;
}

export interface TaskProgressChartProps {
  projects?: Project[];
  loading?: boolean;
}

export interface DashboardStats {
  projects: number;
  users: number;
  employees: number;
  departments: number;
  organizations: number;
  tasks: number;
  loading: boolean;
}