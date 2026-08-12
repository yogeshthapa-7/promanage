import { Skeleton, Card, Row, Col, Table } from 'antd';

export function CardGridSkeleton({
  count = 8,
}: {
  count?: number;
}) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} xs={24} sm={12} lg={8} xl={6}>
          <Card>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function TableSkeleton({
  columns = 5,
  rows = 6,
  message = 'Loading...',
}: {
  columns?: number;
  rows?: number;
  message?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table
        pagination={false}
        loading
        columns={Array.from({ length: columns }).map((_, i) => ({ title: '', dataIndex: `col_${i}`, key: i }))}
        dataSource={Array.from({ length: rows }).map((_, r) => ({ key: r }))}
      />
      <div className="px-4 py-2 text-center text-sm text-slate-400">{message}</div>
    </div>
  );
}

export function BlockSkeleton({
  lines = 3,
  className = '',
  message = 'Loading...',
}: {
  lines?: number;
  className?: string;
  message?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-6 ${className}`}>
      <Skeleton active paragraph={{ rows: lines }} />
      <p className="text-sm text-muted-foreground pt-1">{message}</p>
    </div>
  );
}

export function CardPanelSkeleton({
  count = 6,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Row gutter={[16, 16]} className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} xs={24} md={12} xl={8}>
          <Card>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function LoadingPanel({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground">
      {message}
    </div>
  );
}
