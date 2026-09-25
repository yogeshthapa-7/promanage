export interface Expense {
  SN: number;
  id: number;
  title: string;
  code: string;
  fiscal_year?: string;
  fiscal_year_id?: number;
  document_url?: string;
  document_name?: string;
}
