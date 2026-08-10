import type { ReactNode, HTMLAttributes } from 'react';

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
  return (
    <div
      className={`bg-gradient-to-br from-[#f8faff] via-[#f0f4fd] to-[#e8eef8] rounded-2xl border border-white/50 overflow-hidden ${hover ? 'card-hover gpu-layer-card hover:scale-[1.01]' : ''} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(124,58,237,0.04), 0 8px 24px rgba(124,58,237,0.06)' }}
      {...rest}
    >
      <div className={padding === 'p-6' ? 'p-4' : padding}>
        {children}
      </div>
    </div>
  );
}
