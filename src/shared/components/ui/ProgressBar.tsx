import { Progress as AntProgress } from 'antd';
import type { ProgressBarProps } from '@/shared/components/ui/types/generic-ui-types';


export default function ProgressBar({
  value,
  color = '#3B82F6',
  height = 6,
}: ProgressBarProps) {
  return (
    <AntProgress
      percent={value ?? 0}
      showInfo={false}
      strokeColor={color ?? '#3B82F6'}
      railColor="var(--muted)"
      size={{ height }}
    />
  );
}






