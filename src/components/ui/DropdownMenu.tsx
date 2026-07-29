'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: { label: string; onClick?: () => void; danger?: boolean }[];
  className?: string;
}

export default function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-2xl py-1.5 z-20"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: '160px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={`dropdown-item-${i}`}
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-gray-50"
              style={{ color: item.danger ? '#EF4444' : 'var(--foreground)' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}