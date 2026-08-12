'use client';

import { useState } from 'react';
import { Pagination as AntPagination, Select } from 'antd';

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

  const handlePageSizeChange = (size: number) => {
    setPageSizeVal(size);
    onPageSizeChange?.(size);
  };

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
            <Select
              value={pageSizeVal}
              onChange={handlePageSizeChange}
              size="small"
              className="text-xs"
              options={pageSizeOptions.map((size) => ({ value: size, label: `${size}` }))}
            />
          </div>
        )}
        <AntPagination
          current={currentPage}
          total={total}
          pageSize={pageSize}
          onChange={onPageChange}
          showSizeChanger={false}
          showQuickJumper={false}
        />
      </div>
    </div>
  );
}