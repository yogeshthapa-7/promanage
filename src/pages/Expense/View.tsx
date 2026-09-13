'use client';

import { useEffect } from 'react';
import Drawer from '@/components/drawer';

interface Expense {
  id: number;
  title: string;
  code: string;
  fiscal_year?: string;
  document_url?: string;
}

interface ViewExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export default function ViewExpenseDrawer({ open, onClose, expense }: ViewExpenseDrawerProps) {
  useEffect(() => {
    if (open && expense?.document_url) {
      const link = document.createElement('a');
      link.href = expense.document_url;
      link.target = '_blank';
      link.download = `${expense.title || 'expense'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [open, expense?.document_url, expense?.title]);

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
          <div className="text-base font-semibold text-slate-900">{expense.fiscal_year || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Attachment</div>
          {expense.document_url ? (
            <a href={expense.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base font-medium">
              Download PDF
            </a>
          ) : (
            <div className="text-base text-slate-400">No document attached</div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
