'use client';

import { useState, type ReactNode } from 'react';

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
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-150 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-sm ${className} ${containerClassName}`}
      style={{
        background: focused ? 'white' : 'rgba(255,255,255,0.5)',
        borderColor: focused ? 'var(--primary)' : 'var(--border)',
      }}
    >
      {icon ?? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}