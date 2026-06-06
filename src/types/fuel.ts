export interface FuelRecord {
  _id: string;
  odometer: number;
  fuelType: string;
  ratePerLtr: number;
  totalAmount: number;
  fillingDate: string;
  images: string[];
  average?: number;
  totalFuel?: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  vehicleId?: {
    _id: string;
    vehicleNo: string;
    vehicleCode: string;
  };
}

export interface FuelExpensesResponse {
  data: FuelRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FuelCardStats {
  totalAdded: number;
  totalExpended: number;
  remaining: number;
}

export interface FuelQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateFuelDto {
  vehicleId: string;
  odometer: number;
  fuelType: string;
  ratePerLtr: number;
  totalAmount: number;
  totalFuel?: number;
  fillingDate: string;
  images?: File[];
}

export interface FuelCardEntry {
  _id: string;
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelCardsResponse {
  data: FuelCardEntry[];
}
