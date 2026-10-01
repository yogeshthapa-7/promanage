import { useState } from 'react';
import { Pagination as AntPagination, Select } from 'antd';
import type { PaginationProps } from '@/shared/components/ui/types/generic-ui-types';


export default function Pagination({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const [pageSizeVal, setPageSizeVal] = useState(pageSize);

  const handlePageSizeChange = (size: number) => {
    setPageSizeVal(size);
    onPageSizeChange?.(size);
  };
  

  return (
    <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100/80">
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Rows:</span>
            <Select
              value={pageSizeVal}
              onChange={handlePageSizeChange}
              size="small"
              className="text-xs"
              style={{minWidth: 70}}
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






