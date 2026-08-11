// Reusable loading skeleton components shared across list pages and tabs.
// Use these instead of plain "Loading..." text fallbacks so navigation between
// pages shows a consistent shimmer while the server response is in flight.

type SkeletonProps = {
  className?: string;
};

function Bar({ className = '' }: SkeletonProps) {
  return <div className={`bg-slate-200 rounded ${className}`} />;
}

function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 animate-pulse ${className}`}
    >
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  );
}

/** Grid of card skeletons (projects / organizations style). */
export function CardGridSkeleton({
  count = 8,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Table skeleton with a header row and N shimmer rows, spanning all columns. */
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
      <table className="w-full border-separate border-spacing-y-1.5">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="bg-slate-50 px-4 py-3">
                <Bar className="h-3 w-2/3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="animate-pulse">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="bg-white px-4 py-3 border-b border-slate-100">
                  <Bar className={`h-3 ${c === 0 ? 'w-1/2' : 'w-3/4'}`} />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td colSpan={columns} className="px-4 py-2 text-center text-sm text-slate-400">
              {message}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Plain block skeleton used inside tabs / panels (tasks, subtasks, kanban). */
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
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 animate-pulse space-y-3 ${className}`}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Bar key={i} className={`h-4 ${i === lines - 1 ? 'w-1/3' : 'w-full'}`} />
      ))}
      <p className="text-sm text-muted-foreground pt-1">{message}</p>
    </div>
  );
}

/** Card-grid skeleton specifically for task/subtask panels. */
export function CardPanelSkeleton({
  count = 6,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Bar className="h-4 w-1/2" />
            <Bar className="h-5 w-16 rounded-full" />
          </div>
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-2/3" />
          <div className="flex items-center justify-between pt-1">
            <Bar className="h-7 w-24 rounded-full" />
            <Bar className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Generic full-page skeleton block. */
export function LoadingPanel({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-base text-muted-foreground animate-pulse">
      {message}
    </div>
  );
}
