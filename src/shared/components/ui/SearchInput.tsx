
import { Input } from 'antd';
import type { SearchInputProps } from '@/shared/components/ui/types/generic-ui-types';


export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  icon,
  className = '',
  containerClassName = '',
}: SearchInputProps) {
  return (
    <div className={containerClassName}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        prefix={icon}
        className={className}
        allowClear
      />
    </div>
  );
}






