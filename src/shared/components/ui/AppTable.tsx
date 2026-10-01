import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import Card from './Card';
import type { AppTableProps, ServerPaginationProps } from '@/shared/components/ui/types/generic-ui-types';
import Pagination from './Pagination';

type CombinedProps<T> = AppTableProps<T> & ServerPaginationProps;


export default function AppTable<T>({
  columns,
  loading = false,
  emptyText = 'No data found',
  cardClassName = '',
  cardStyle,
  toolbar,
  rowHoverClassName = '',
  dataSource,
  ...rest
}: CombinedProps<T>) {
  const rowClassName = (_record: T, index: number) => {
    const base = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
    return rowHoverClassName ? `${base} ${rowHoverClassName}` : base;
  };

  const {
    total,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
  } = rest as ServerPaginationProps;

  const hasPagination = typeof total === 'number' && typeof onPageChange === 'function';

  return (
    <Card className={cardClassName} style={cardStyle}>
      {toolbar && <div className="mb-4">{toolbar}</div>}
      <div className="overflow-x-auto">
        <Table<T>
          className="app-table-highlight"
          columns={columns}
          loading={loading}
          dataSource={dataSource}
          pagination={false}
          locale={{ emptyText }}
          bordered={false}
          size="middle"
          rowClassName={rowClassName}
          {...(rest as TableProps<T>)}
        />
      </div>
      {
        hasPagination && (
          <Pagination
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
        )
      }
    </Card>
  );
}






