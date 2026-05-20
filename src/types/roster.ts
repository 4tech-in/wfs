

import { FamilyMember, AcademicQualification, WorkExperience, EmployeeDocument } from './employee';

export interface Roster {
  _id: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  shiftId: string;
  shiftName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignRosterDto {
  employeeIds: string[];
  shiftId: string;
  startDate: string;
  endDate: string;
}

export interface AssignAttendancePolicyDto {
  userIds: string[];
  attendancePolicyId: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface RosterResponse {
  rosters: Roster[];
}

export interface AttendancePolicyUser {
  _id: string;
  name: string;
  email?: string;
  createdBy: string;
  role: string;
  uniqueId: number;
  gender: string;
  dob?: string;
  doj?: string;
  permanentAddress?: string;
  currentAddress?: string;
  mobileNo: string;
  familyDetails: FamilyMember[];
  academicQualification: AcademicQualification[];
  previousWorkExperience: WorkExperience[];
  otherDocuments: EmployeeDocument[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  attendancePolicyId?: string | { name: string; _id: string };
  companyId?: string | { name: string; _id: string };
  departmentId?: string;
  designationId?: string;
  employeeObjId?: {
    _id: string;
    employeeId: string;
  };
  maritalStatus?: string;
  department?: string;
  designation?: string;
  attendancePolicyStartDate?: string;
  attendancePolicyEndDate?: string;
  employeeId?: string;
  otherName?: string;
  fatherName?: string;
}

export interface AttendancePolicyUserResponse {
  data: AttendancePolicyUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Assign24HourPolicyDto {
  userIds: string[];
  is24HourShift: boolean;
}

