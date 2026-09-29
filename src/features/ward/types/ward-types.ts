export interface Ward {
  SN: number;
  id: number;
  wardNumber: string;
  wardCode: string;
}

export interface CreateWardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingWard?: Ward | null;
}

export interface ApiWardResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiWardRow[];
}

export interface ApiWardRow {
  SN: number;
  WardInfoID: number;
  WardNumber: string;
  WardCode: string;
}

export interface FetchWardsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchWardsResult {
  wards: Ward[];
  total: number;
  filtered: number;
}






