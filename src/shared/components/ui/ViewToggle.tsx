import { LayoutGrid, List } from 'lucide-react';
import Button from './Button';
import type { ViewToggleProps } from '@/shared/components/ui/types/generic-ui-types';

type ViewMode = 'grid' | 'list';

export default function ViewToggle({ viewMode, onViewModeChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center bg-white/70 border border-border rounded-xl p-0.5 shadow-xs ${className}`}>
      <Button
        type="text"
        onClick={() => onViewModeChange('list')}
        className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        icon={<List className="w-4 h-4" />}
      />
      <Button
        type="text"
        onClick={() => onViewModeChange('grid')}
        className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        icon={<LayoutGrid className="w-4 h-4" />}
      />
    </div>
  );
}






