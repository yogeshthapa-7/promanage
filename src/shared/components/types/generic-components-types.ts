//Antd Nepali Date Picker Component
export interface AntdNepaliDatePickerProps {
  value?: string;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  returnEnglishDate?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

//App Layout Component
export interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  background?: React.ReactNode;
  showTopbar?: boolean;
}

//Document Field Upload Component
export interface DocumentUploadFieldProps {
  value?: string;
  onChange?: (url: string) => void;
  uploading?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  accept?: string;
}

export interface FileTypeConfig {
  extension: string[];
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

//Drawer Component
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
  zIndex?: number;
}

//Sidebar Component
export interface NavItem { 
    id: string; 
    label: string; 
    icon: React.ReactNode; 
    href: string; 
    badge?: number; 
    section?: string; 
}

export interface SidebarProps { 
    collapsed?: boolean; 
    onToggle?: () => void; 
    mobileOpen?: boolean; 
    onMobileClose?: () => void; 
}

//Topbar Component
export interface TopbarProps {
  pageTitle?: string;
  pageSubtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  filterStatus?: ProjectStatus | 'All';
  onFilterChange?: (status: ProjectStatus | 'All') => void;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  onMenuToggle?: () => void;
}

//Viewtaskdrawer Component
export interface ViewTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  taskId: number | null;
}

//hooks/usepaginatedlist hook
export interface PaginatedListParams {
  start: number;
  length: number;
  signal?: AbortSignal;
  [key: string]: unknown;
}

export interface PaginatedListResult<T> {
  items: T[];
  total: number;
}

export interface UsePaginatedListOptions<T> {
  fetcher: (params: PaginatedListParams) => Promise<PaginatedListResult<T>>;
  initialPageSize?: number;
  extraDeps?: unknown[];
  extraParams?: Record<string, unknown>;
}

export interface UsePaginatedListReturn<T> {
  data: T[];
  total: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
}