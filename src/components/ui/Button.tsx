'use client';

import { memo, type ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
}

const baseStyles = 'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

const variantStyles = {
  primary: 'px-3.5 py-2 text-sm text-white bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md hover:shadow-lg hover:shadow-purple-500/20',
  ghost: 'px-3 py-1.5 text-xs text-muted-foreground border border-border bg-white/60 hover:border-primary hover:text-primary hover:bg-white',
  outline: 'px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground bg-gray-50/50 hover:border-primary/30 hover:text-primary hover:bg-white',
  icon: 'p-1.5 rounded-lg text-muted-foreground hover:bg-gray-100 hover:text-primary transition-colors',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
};

const Button = memo(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
});

export default Button;