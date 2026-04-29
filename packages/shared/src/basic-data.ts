export interface Manufacturer {
  approval_no: string;
  name: string;
  city: string;
  address: string;
  postal_code: string;
  phone: string;
  is_gmp: boolean;
}

export interface Drug {
  approval_no: string;
  name: string;
  scientific_name: string;
  model: string;
  specification: string;
  is_prescription: boolean;
}

export interface MedicalInstitution {
  approval_no: string;
  name: string;
  address: string;
  postal_code: string;
  phone: string;
  is_specialized: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  manager: string;
}

export interface StorageLocation {
  id: number;
  warehouseId: number;
  code: string;
  capacity: number;
  description: string;
  warehouse?: Warehouse;
  currentStock?: number;
}
