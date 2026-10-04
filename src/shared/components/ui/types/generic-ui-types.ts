import type { ReactNode, HTMLAttributes } from 'react';
import type { TableProps, ColumnsType } from 'antd/es/table';

//AppIcon ui
export type IconVariant = 'outline' | 'solid';
export type IconType = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type StatIconType = 'folder' | 'clock' | 'check' | 'alert' | 'users' | 'dollar' | 'trending' | 'user-square' | 'building-2' | 'folder-open';
export type ViewMode = 'grid' | 'list';

//AppIcon ui
export interface IconProps {
    name: string;
    variant?: IconVariant;
    size?: number;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

//AppImage ui
export interface AppImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    fill?: boolean;
    sizes?: string;
    onClick?: () => void;
    fallbackSrc?: string;
    loading?: 'lazy' | 'eager';
}

//AppLogo ui
export interface AppLogoProps {
  src?: string;
  iconName?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

//Avatar ui
export interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export interface AvatarStackProps {
  items: { src: string; alt: string; id: string }[];
  size?: number;
  extra?: number;
  extraLabel?: string;
}

//Badge ui
export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'status' | 'priority' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

//Button ui
export interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'large';
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: (e?: any) => void;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  danger?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  htmlType?: 'button' | 'submit' | 'reset';
}

//Card ui
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
}

//Dropdown ui
export interface DropdownMenuProps {
  trigger: ReactNode;
  items: { label: string; onClick?: () => void; danger?: boolean }[];
  className?: string;
}

//Pagination ui
export interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

//progressbar ui
export interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

//searchinput ui
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  containerClassName?: string;
}

//statcard ui
export interface StatCardProps {
  title: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
  iconBg?: string;
  iconColor?: string;
  iconType?: StatIconType;
  icon?: React.ReactNode;
  sparklineData?: number[];
  sparklineColor?: string;
}

//viewtoggle ui
export interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

//App Table
export interface AppTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnsType<T>;
  loading?: boolean;
  emptyText?: string;
  cardClassName?: string;
  cardStyle?: React.CSSProperties;
  toolbar?: React.ReactNode;
  rowHoverClassName?: string;
}

export interface ServerPaginationProps {
    total: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}