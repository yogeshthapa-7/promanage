import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import Card from './Card';

export interface AppTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnsType<T>;
  loading?: boolean;
  emptyText?: string;
  cardClassName?: string;
  cardStyle?: React.CSSProperties;
  toolbar?: React.ReactNode;
  rowHoverClassName?: string;
}

export default function AppTable<T extends { key?: React.Key }>({
  columns,
  loading = false,
  emptyText = 'No data found',
  cardClassName = '',
  cardStyle,
  toolbar,
  rowHoverClassName = '',
  ...rest
}: AppTableProps<T>) {
  const rowClassName = (record: T, index: number) => {
    const base = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
    return rowHoverClassName ? `${base} ${rowHoverClassName}` : base;
  };

  return (
    <Card className={cardClassName} style={cardStyle}>
      {toolbar && <div className="mb-4">{toolbar}</div>}
      <Table<T>
        className="app-table-highlight"
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{ emptyText }}
        bordered={false}
        size="middle"
        rowClassName={rowClassName}
        {...rest}
      />
    </Card>
  );
}
