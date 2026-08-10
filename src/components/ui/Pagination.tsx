'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  totalLabel?: string;
}

export default function Pagination({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  totalLabel,
}: PaginationProps) {
  const [pageSizeVal, setPageSizeVal] = useState(pageSize);

  const totalPages = Math.ceil(total / pageSize);

  const handlePageSizeChange = (size: number) => {
    setPageSizeVal(size);
    onPageSizeChange?.(size);
  };

  const pages = useMemo(() => {
    if (totalPages <= 0) return [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
  }, [currentPage, totalPages]);

  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const label = totalLabel ?? `Showing ${start} to ${end} of ${total} items`;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100/80">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Rows:</span>
            <select
              value={pageSizeVal}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded-lg border border-gray-100 bg-white outline-none cursor-pointer"
              style={{ color: 'var(--foreground)' }}
            >
              {pageSizeOptions.map((size) => (
                <option key={`pagesize-${size}`} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg transition-all duration-150 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ChevronLeft size={14} />
          </button>
          {pages.map((pageNum) => (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className="w-7 h-7 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95"
              style={{
                background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                color: currentPage === pageNum ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg transition-all duration-150 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}