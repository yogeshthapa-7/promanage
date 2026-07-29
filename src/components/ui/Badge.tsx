import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'status' | 'priority' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles = {
  default: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
  status: 'badge-status',
  priority: 'badge-priority',
  outline: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-border',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span className={`${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}