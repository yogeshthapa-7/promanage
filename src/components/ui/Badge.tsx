import type { ReactNode } from 'react';
import { Tag as AntTag } from 'antd';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'status' | 'priority' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
  style,
}: BadgeProps) {
  const color = style?.color as string | undefined;
  const bg = (style?.background as string) || undefined;

  if (variant === 'outline') {
    return (
      <AntTag bordered style={bg ? { borderColor: color || bg, color } : undefined} className={className}>
        {children}
      </AntTag>
    );
  }

  return (
    <AntTag
      color={bg ? undefined : (color || 'default')}
      style={bg ? { background: bg, borderColor: bg, color } : style}
      className={className}
    >
      {children}
    </AntTag>
  );
}