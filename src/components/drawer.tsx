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
  zIndex?: number;
}

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 480,
  zIndex = 9999,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const bodyOverflowRef = useRef('');
  const bodyPaddingRightRef = useRef('');
  const bodyLockedRef = useRef(false);
  onCloseRef.current = onClose;

const unlockBody = () => {
    if (!bodyLockedRef.current) return;
    
    // Use requestAnimationFrame for smooth restore to prevent layout shift
    requestAnimationFrame(() => {
      document.body.style.overflow = bodyOverflowRef.current;
      document.body.style.paddingRight = bodyPaddingRightRef.current;
      bodyLockedRef.current = false;
    });
  };

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
      
      // Fix: Calculate and set body styles in same frame to prevent layout shift
      const updateBodyStyles = () => {
        bodyOverflowRef.current = document.body.style.overflow;
        bodyPaddingRightRef.current = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        // Only set padding if there's actually a scrollbar to compensate for
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        document.body.style.overflow = 'hidden';
        bodyLockedRef.current = true;
      };
      
      // Use requestAnimationFrame to ensure we read current styles before writing
      requestAnimationFrame(updateBodyStyles);
    } else if (mounted) {
      setVisible(false);
      timeoutRef.current = window.setTimeout(() => {
        setMounted(false);
        unlockBody();
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
      unlockBody();
    };
  }, [open]);

  useEffect(() => {
    return () => {
      unlockBody();
    };
  }, []);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === 'transform' && !visible) {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setMounted(false);
      unlockBody();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 flex" style={{ zIndex }} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={close}
      />

     <div
  className={`relative h-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#fef2f2] shadow-2xl border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
    visible ? 'translate-x-0' : 'translate-x-full'
  }`}
  style={{
    width: '100%',
    maxWidth: width,
    marginLeft: 'auto',
    transform: visible ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  }}
  onTransitionEnd={handleTransitionEnd}
>
  {(title || subtitle) && (
    <div className="relative flex items-start justify-between px-4 py-4 sm:px-7 sm:pt-7 sm:pb-5 shrink-0 border-b border-slate-200/80 bg-white/40">
      <div>
        {title && (
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        )}

        {subtitle && (
          <p className="text-sm text-slate-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={close}
        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )}

    <div
     className="flex-1 overflow-y-auto drawer-scrollbar px-4 py-4 sm:px-7 sm:py-6"
     style={{ maxHeight: 'calc(100vh - 100px)' }}
   >
    {children}
  </div>
</div>
    </div>,
    document.body
  );
}
