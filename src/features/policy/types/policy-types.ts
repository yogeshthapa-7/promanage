export interface Policy {
  SN: number;
  id: number;
  name: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}

export interface CreatePolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (savedData?: { id?: number; document_url?: string; isNew?: boolean }) => void;
  editingPolicy?: Policy | null;
}

export interface ViewPolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  policy: Policy | null;
  fiscalYearOptions?: FiscalYearSelectOption[];
}






