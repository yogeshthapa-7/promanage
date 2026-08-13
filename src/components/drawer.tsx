'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
}

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 480,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const close = () => onCloseRef.current();

  useEffect(() => {
    if (open) {
      setMounted(true);
      setVisible(false);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      document.body.style.overflow = 'hidden';
    } else if (mounted) {
      setVisible(false);
      timeoutRef.current = window.setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = '';
      }, 320);
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === 'transform' && !visible) {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setMounted(false);
      document.body.style.overflow = '';
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex" aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={close}
      />

     <div
  className={`relative h-full bg-gradient-to-b from-[#F8FAFC] via-[#F5F8FC] to-[#EEF3F8] shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
    visible ? 'translate-x-0' : 'translate-x-full'
  }`}
  style={{
    width,
    marginLeft: 'auto',
    transform: visible ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  }}
  onTransitionEnd={handleTransitionEnd}
>
  {(title || subtitle) && (
    <div className="relative flex items-start justify-between px-7 pt-7 pb-5 shrink-0 border-b border-slate-200/80 bg-white/70">
      <div>
        {title && (
          <h2 className="text-xl font-bold tracking-tight text-[#172554]">
            {title}
          </h2>
        )}

        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={close}
        className="p-2 rounded-xl text-slate-400 hover:text-[#172554] hover:bg-slate-100 transition-all cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )}

  <div
    className="flex-1 overflow-y-auto px-7 py-6"
    style={{ maxHeight: 'calc(100vh - 100px)' }}
  >
    {children}
  </div>
</div>
    </div>,
    document.body
  );
}
