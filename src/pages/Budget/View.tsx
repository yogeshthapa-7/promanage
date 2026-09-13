'use client';

import { useEffect } from 'react';
import Drawer from '@/components/drawer';

interface Budget {
  id: number;
  name: string;
  fiscal_year?: string;
  document_url?: string;
}

interface ViewBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  budget: Budget | null;
}

export default function ViewBudgetDrawer({ open, onClose, budget }: ViewBudgetDrawerProps) {
  useEffect(() => {
    if (open && budget?.document_url) {
      const link = document.createElement('a');
      link.href = budget.document_url;
      link.target = '_blank';
      link.download = `${budget.name || 'budget'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [open, budget?.document_url, budget?.name]);

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
          <div className="text-base font-semibold text-slate-900">{budget.fiscal_year || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Attachment</div>
          {budget.document_url ? (
            <a href={budget.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base font-medium">
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
