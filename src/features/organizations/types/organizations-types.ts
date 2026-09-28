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






