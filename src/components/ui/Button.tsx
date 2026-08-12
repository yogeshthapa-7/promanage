'use client';

import { memo, type ReactNode } from 'react';
import { Button as AntButton } from 'antd';

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  danger?: boolean;
}

const variantStyles: Record<string, { type?: 'primary' | 'default' | 'dashed' | 'text' | 'link' | undefined; shape?: 'circle' | 'round' | undefined }> = {
  primary: {},
  ghost: { type: 'text' },
  outline: { type: 'default' },
  icon: { type: 'text', shape: 'circle' },
};

const sizeStyles: Record<string, { size?: 'small' | 'middle' | 'large' | undefined }> = {
  sm: { size: 'small' },
  md: {},
  lg: { size: 'large' },
};

const Button = memo(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  children,
  onClick,
  type,
  danger,
}: ButtonProps) {
  const antProps: Record<string, unknown> = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(type ? { type } : {}),
    ...(danger ? { danger } : {}),
    ...(onClick ? { onClick } : {}),
  };

  if (icon) {
    antProps.icon = icon;
  }

  return (
    <AntButton {...antProps} className={className}>
      {children}
    </AntButton>
  );
});

export default Button;