export interface Label {
  SN: number;
  id: number;
  name: string;
  code: string;
}

export interface CreateLabelDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingLabel?: Label | null;
}

export interface ApiLabelResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiLabelRow[];
}

export interface ApiLabelRow {
  SN: number;
  LabelInfoID: number;
  LabelName: string;
  LabelCode: string;
}

export interface FetchLabelsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchLabelsResult {
  labels: Label[];
  total: number;
  filtered: number;
}








