import Drawer from '@/components/drawer';
import { type FiscalYearSelectOption } from '@/types/fiscal-year-types';

interface Budget {
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

interface ViewBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  budget: Budget | null;
  fiscalYearOptions?: FiscalYearSelectOption[];
}

function getFiscalYearName(budget: Budget, options: FiscalYearSelectOption[]): string {
  const raw = budget.fiscal_year_id ?? budget.fiscal_year;
  if (raw === undefined || raw === null) return '—';
  const match = options.find((opt) => opt.value === String(raw));
  return match?.label || String(raw);
}

export default function ViewBudgetDrawer({ open, onClose, budget, fiscalYearOptions = [] }: ViewBudgetDrawerProps) {
  if (!budget) return null;

  return (
    <Drawer open={open} onClose={onClose} title={budget.name || 'Budget Details'} subtitle="View budget information and download attachment." width={480}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Budget Name</div>
          <div className="text-base font-semibold text-slate-900">{budget.name || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Fiscal Year</div>
          <div className="text-base font-semibold text-slate-900">{getFiscalYearName(budget, fiscalYearOptions)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">File Name</div>
          {budget.document_url ? (
            <a href={budget.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base font-medium">
              {budget.document_name || 'Download File'}
            </a>
          ) : (
            <div className="text-base text-slate-400">No document attached</div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

