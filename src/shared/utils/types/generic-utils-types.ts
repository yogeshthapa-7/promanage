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

//client config utilities
export interface ClientConfig {
  clientCode: string;
  appType: string;
  localBodyLevel: number;
}

export interface ParsedClientConfig {
  currentClientCode: string;
  localBodyLevel: number;
}

//csv utilities
export interface CsvColumn<T> {
  /** Header label written in the first row. */
  header: string;
  /** Extract the raw cell value for a given row. */
  value: (row: T) => unknown;
}

//nepali date utilities
export interface BSDate {
  year: number;   // e.g. 2081
  month: number;  // 1 to 12
  day: number;    // 1 to 32
}