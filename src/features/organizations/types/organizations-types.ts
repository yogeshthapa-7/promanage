export interface Organization {
  SN: number;
  id: number;
  title: string;
  parentOrganizationId: number;
  parentOrganizationName: string;
}

export interface OrganizationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrganization?: Organization | null;
}

export interface ParentOrgOption {
  OrganizationID: number;
  Title: string;
}

export interface ApiOrganizationResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiOrganizationRow[];
}

export interface ApiOrganizationRow {
  SN: number;
  OrganizationID: number;
  ParentOrganizationID: number;
  ParentOrganizationName: string;
  Title: string;
}

export interface ApiSelectItem {
  OrganizationID?: number | string;
  Title?: string;
  name?: string;
  id?: number | string;
  Value?: number | string;
  Text?: string;
}

export interface FetchOrganizationsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchOrganizationsResult {
  organizations: Organization[];
  total: number;
  filtered: number;
}





