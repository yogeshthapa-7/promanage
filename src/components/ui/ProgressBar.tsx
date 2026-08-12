import { Progress as AntProgress } from 'antd';

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
    <AntProgress
      percent={value}
      showInfo={false}
      strokeColor={color}
      railColor="var(--muted)"
      size={{ height }}
    />
  );
}