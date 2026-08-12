'use client';

import type { ReactNode } from 'react';
import { Input } from 'antd';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  containerClassName?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  icon,
  className = '',
  containerClassName = '',
}: SearchInputProps) {
  return (
    <div className={containerClassName}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        prefix={icon}
        className={className}
        allowClear
      />
    </div>
  );
}