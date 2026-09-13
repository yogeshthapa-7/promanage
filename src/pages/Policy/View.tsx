'use client';

import { useEffect } from 'react';
import Drawer from '@/components/drawer';

interface Policy {
  id: number;
  name: string;
  fiscal_year?: string;
  document_url?: string;
}

interface ViewPolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  policy: Policy | null;
}

export default function ViewPolicyDrawer({ open, onClose, policy }: ViewPolicyDrawerProps) {
  useEffect(() => {
    if (open && policy?.document_url) {
      const link = document.createElement('a');
      link.href = policy.document_url;
      link.target = '_blank';
      link.download = `${policy.name || 'policy'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [open, policy?.document_url, policy?.name]);

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
          <div className="text-base font-semibold text-slate-900">{policy.fiscal_year || '—'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-1">Attachment</div>
          {policy.document_url ? (
            <a href={policy.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-base font-medium">
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
