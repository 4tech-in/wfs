import { Employee } from "./employee";

export type AssetType = "Laptop" | "Safety Gear" | "Specialized Tool" | "Uniform" | "Mobile Device" | "Electronics" | "HVAC" | "Other" | (string & {});
export type AssetStatus = "In Stock" | "Issued" | "Returned" | "Under Maintenance" | "Damaged";
export interface Asset {
  id?: string;
  _id: string;
  name: string;
  type: AssetType;
  serialNumber: string;
  issuedTo?: string | Employee; // Optional: Employee ID or Populated Employee Object
  issuedDate?: string; // Optional: Date when issued
  returnDate?: string;
  status: AssetStatus;
  maintenanceDueDate: string;
  lastMaintenanceDate?: string;
  maintenanceIntervalDays?: number;
  maintenanceFrequency?: string;
  extraNote?: string;
}

export type CreateAssetDto = Omit<Asset, "id" | "_id">;
export type UpdateAssetDto = Partial<CreateAssetDto>;

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssetsResponse {
  success: boolean;
  data: Asset[];
  pagination: Pagination;
}

export interface AssetQueryParams {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}
