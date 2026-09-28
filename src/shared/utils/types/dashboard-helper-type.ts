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