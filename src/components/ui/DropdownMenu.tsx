'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: { label: string; onClick?: () => void; danger?: boolean }[];
  className?: string;
}

const VIEWPORT_PADDING = 8;

export default function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = rect.bottom + 6;
    let left = rect.right - 90;

    if (menuRef.current) {
      const menuHeight = menuRef.current.offsetHeight;
      const menuWidth = menuRef.current.offsetWidth;

      if (top + menuHeight > viewportHeight - VIEWPORT_PADDING) {
        top = rect.top - menuHeight - 6;
      }

      if (left < VIEWPORT_PADDING) {
        left = VIEWPORT_PADDING;
      } else if (left + menuWidth > viewportWidth - VIEWPORT_PADDING) {
        left = viewportWidth - menuWidth - VIEWPORT_PADDING;
      }
    } else {
      if (top + 200 > viewportHeight - VIEWPORT_PADDING) {
        top = rect.top - 200 - 6;
      }
      if (left < VIEWPORT_PADDING) {
        left = VIEWPORT_PADDING;
      } else if (left + 90 > viewportWidth - VIEWPORT_PADDING) {
        left = viewportWidth - 90 - VIEWPORT_PADDING;
      }
    }

    setPosition({
      top: Math.max(VIEWPORT_PADDING, top),
      left: Math.max(VIEWPORT_PADDING, left),
    });
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [open, calculatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleScroll() {
      if (open) calculatePosition();
    }
    function handleResize() {
      if (open) calculatePosition();
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, calculatePosition]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        ref={triggerRef}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {trigger}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-slate-50 border border-slate-200 rounded-xl py-1 z-[9999]"
            style={{
              top: position.top,
              left: position.left,
              boxShadow: '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
              minWidth: '90px',
              maxWidth: '120px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, i) => (
              <button
                key={`dropdown-item-${i}`}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className="block w-full text-left px-2 py-1.5 text-[11px] font-medium transition-colors duration-150 hover:bg-white hover:shadow-sm truncate"
                style={{ color: item.danger ? '#EF4444' : 'var(--foreground)' }}
                title={item.label}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
