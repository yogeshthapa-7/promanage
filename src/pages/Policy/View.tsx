'use client';

import Drawer from '@/components/drawer';
import { type FiscalYearSelectOption } from '@/lib/fiscal-year-data';

interface Policy {
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
}

interface ViewPolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  policy: Policy | null;
  fiscalYearOptions?: FiscalYearSelectOption[];
}

function getFiscalYearName(policy: Policy, options: FiscalYearSelectOption[]): string {
  const raw = policy.fiscal_year_id ?? policy.fiscal_year;
  if (raw === undefined || raw === null) return '—';
  const match = options.find((opt) => opt.value === String(raw));
  return match?.label || String(raw);
}

export default function ViewPolicyDrawer({ open, onClose, policy, fiscalYearOptions = [] }: ViewPolicyDrawerProps) {
  if (!policy) return null;

  return (
    <Drawer open={open} onClose={onClose} title={policy.name || 'Policy Details'} subtitle="View policy information and download attachment." width={480}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Policy Name</div>
          <div className="text-base font-semibold text-slate-900">{policy.name || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Fiscal Year</div>
          <div className="text-base font-semibold text-slate-900">{getFiscalYearName(policy, fiscalYearOptions)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">File Name</div>
          {policy.document_url ? (
            <a href={policy.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base font-medium">
              Download File
            </a>
          ) : (
            <div className="text-base text-slate-400">No document attached</div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
