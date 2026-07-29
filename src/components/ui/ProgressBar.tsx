interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({
  value,
  color = '#3B82F6',
  height = 6,
}: ProgressBarProps) {
  return (
    <div
      className="flex-1 rounded-full overflow-hidden"
      style={{ height, background: 'var(--muted)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}