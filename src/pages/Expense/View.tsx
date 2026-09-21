'use client';

import Drawer from '@/components/drawer';
import { type FiscalYearSelectOption } from '@/lib/fiscal-year-data';

interface Expense {
  id: number;
  title: string;
  code: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

interface ViewExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  fiscalYearOptions?: FiscalYearSelectOption[];
}

function getFiscalYearName(expense: Expense, options: FiscalYearSelectOption[]): string {
  const raw = expense.fiscal_year_id ?? expense.fiscal_year;
  if (raw === undefined || raw === null) return '—';
  const match = options.find((opt) => opt.value === String(raw));
  return match?.label || String(raw);
}

export default function ViewExpenseDrawer({ open, onClose, expense, fiscalYearOptions = [] }: ViewExpenseDrawerProps) {
  if (!expense) return null;

  return (
    <Drawer open={open} onClose={onClose} title={expense.title || 'Expense Details'} subtitle="View expense information and download attachment." width={480}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Expense Title</div>
          <div className="text-base font-semibold text-slate-900">{expense.title || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Expense Code</div>
          <div className="text-base font-semibold text-slate-900">{expense.code || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Fiscal Year</div>
          <div className="text-base font-semibold text-slate-900">{getFiscalYearName(expense, fiscalYearOptions)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">File Name</div>
          {expense.document_url ? (
            <a href={expense.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base font-medium">
              {expense.document_name || 'Download File'}
            </a>
          ) : (
            <div className="text-base text-slate-400">No document attached</div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
