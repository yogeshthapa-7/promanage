'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { Card as AntCard } from 'antd';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  ...rest
}: CardProps) {
  const bodyStyle: React.CSSProperties = padding === 'p-6' ? { padding: 16, overflow: 'visible' } : { overflow: 'visible' };
  
  return (
    <AntCard
      className={className}
      styles={{ body: bodyStyle }}
      style={{
        background: '#f8fafc',
        boxShadow: '0 1px 3px rgba(124,58,237,0.04), 0 8px 24px rgba(124,58,237,0.06)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)',
        ...(hover ? { cursor: 'pointer' } : {}),
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(79,70,229,0.18)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(124,58,237,0.04), 0 8px 24px rgba(124,58,237,0.06)';
        }
      }}
      {...rest}
    >
      {children}
    </AntCard>
  );
}
