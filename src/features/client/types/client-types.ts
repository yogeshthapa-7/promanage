export interface Client {
  SN: number;
  id: number;
  clientCode: string;
  clientName: string;
  clientStatus: number;
  contactNo: string;
  contactPerson: string;
  email: string;
  logo: string;
  address: string;
  status: number;
}

export interface CreateClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingClient?: Client | null;
}

export interface ApiClientResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiClientRow[];
}

export interface ApiClientRow {
  SN: number;
  ClientInfoID: number;
  ClientCode: string;
  ClientName: string;
  ClientStatus: number;
  ContactNo: string;
  ContactPerson: string;
  Email: string;
  Logo: string;
  Address: string;
  Status: number;
}

export interface FetchClientsParams {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}

export interface FetchClientsResult {
  clients: Client[];
  total: number;
  filtered: number;
}






