import { Progress as AntProgress } from 'antd';
import type { ProgressBarProps } from '@/shared/components/ui/types/generic-ui-types';


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






