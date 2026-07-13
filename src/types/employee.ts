import { Asset } from "./asset";

export type EmployeeRole = "user" | "hr" | "admin";
export type EmployeeStatus = "present" | "absent" | "on-leave" | "not-marked" | "all";


export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface FamilyMember {
  name: string;
  relation: string;
  age: number;
  _id?: string;
}

export interface AcademicQualification {
  degree: string;
  institute: string;
  year: string;
  _id?: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  years: string;
  _id?: string;
}

export interface EmployeeDocument {
  title: string;
  url: string;
  file?: File | null;
  _id?: string;
}

export interface Employee {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: EmployeeRole;
  uniqueId: number;
  password?: string;
  companyId?: string;
  attendancePolicyId?: string;
  payrollPolicyId?: string;
  otherName?: string;
  category?: string;
  gender: "male" | "female" | "other";
  fatherName: string;
  motherName: string;
  maritalStatus: "single" | "married" | "divorced" | "widowed";
  spouseName?: string;
  employeeId?: string;
  familyDetails?: FamilyMember[];
  dob: string;
  bloodGroup: string;
  emergencyContact?: EmergencyContact;
  reference?: string;
  academicQualification: AcademicQualification[];
  previousWorkExperience?: WorkExperience[];
  interviewDate?: string;
  designation: string;
  department?: string;
  designationId?: { _id: string; name: string };
  departmentId?: { _id: string; name: string };
  workingHours?: string;
  aadharNo: string;
  pfNo?: string;
  esiNo?: string;
  doj: string;
  permanentAddress: string;
  currentAddress: string;
  mobileNo: string;
  documents?: EmployeeDocument[];
  otherDocuments?: { _id: string; title?: string; file?: string; files?: string[] }[];
  profileImage?: string | File | null;
  profilePicture?: string | File | null;
  employeeObjId?: {
    _id: string;
    employeeId: string;
  };
  createdBy?: string;
  notes?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  assets?: Asset[];
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeesResponse {
  data: Employee[];
  pagination: PaginationInfo;
}

export interface RegisterEmployeeDto extends Omit<Employee, "id" | "_id"> {
  password?: string;
}

export type UpdateEmployeeDto = Partial<RegisterEmployeeDto>;

export interface EmployeeQueryParams {
  page?: number;
  limit?: number | string;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  companyId?: string;
  prefix?: string;
  departmentId?: string;
  designationId?: string;
  gender?: string;
  attendancePolicyStatus?: string;
}

export interface EmployeeDropdownItem {
  _id: string;
  name: string;
  employeeId: string;
  uniqueId?: number;
  otherName?: string;
}

export interface EmployeeDropdownResponse {
  success: boolean;
  data: EmployeeDropdownItem[];
  pagination: PaginationInfo;
}
export interface EmployeeStats {
  overall: {
    totalUsers: number;
    male: number;
    female: number;
    other: number;
  };
  companyWise: {
    totalUsers: number;
    male: number;
    female: number;
    other: number;
    companyId: string;
    companyName: string;
  }[];
  departmentWise?: {
    totalUsers: number;
    male: number;
    female: number;
    other: number;
    departmentId: string;
    departmentName: string;
  }[];
}

export interface EmployeeStatsResponse {
  success: boolean;
  data: EmployeeStats;
}
