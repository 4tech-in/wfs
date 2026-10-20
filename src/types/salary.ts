export type SalaryType = 'monthly' | 'hourly' | 'daily';

export interface SalaryPayload {
  userId?: string;
  userIds?: string[];
  hourly: boolean;
  monthly: boolean;
  daily: boolean;
  monthlySalary?: number;
  hourlyRate?: number;
  dailyRate?: number;
}

export interface SalaryListItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    employeeId: string;
    email?: string;
    otherName?: string;
  };
  user?: {
    _id: string;
    name: string;
    employeeId: string;
    email?: string;
    otherName?: string;
  };
  hourly: boolean;
  monthly: boolean;
  daily: boolean;
  monthlySalary?: number;
  hourlyRate?: number;
  dailyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollCalculationResult {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  email?: string;
  month: string;
  designation?: string;
  department?: string;
  companyName?: string;
  doj?: string;
  aadharNo?: string;
  pfNo?: string;
  esiNo?: string;
  mobileNo?: string;
  salaryType?: SalaryType;
  rate?: number;
  totalCalendarDays?: number;
  totalWorkingDays?: number;
  holidaysCount?: number;
  weeklyOffCount?: number;
  presentDays?: number;
  halfDays?: number;
  absentDays?: number;
  paidSundays?: number;
  totalWorkedMinutes?: number;
  totalOvertimeHours: number;
  overtimeRate?: number;
  totalPaidDays: number;
  basePay: number;
  overtimePay: number;
  grossEarnings?: number;
  totalDeductions?: number;
  netPay: number;
  payrollDetails?: {
    basic?: number;
    hra?: number;
    conveyance?: number;
    pfEmployee?: number;
    esiEmployee?: number;
    lwfEmployee?: number;
    [key: string]: number | undefined;
  };
}

export interface SalaryListResponse {
  message: string;
  data: SalaryListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BulkPayrollEmployeeItem {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  email?: string;
  designation?: string;
  department?: string;
  companyName?: string;
  doj?: string;
  aadharNo?: string;
  pfNo?: string;
  esiNo?: string;
  mobileNo?: string;
  salaryType: SalaryType;
  rate: number;
  totalCalendarDays?: number;
  totalWorkingDays?: number;
  holidaysCount?: number;
  weeklyOffCount?: number;
  presentDays?: number;
  halfDays?: number;
  absentDays?: number;
  paidSundays?: number;
  totalWorkedMinutes?: number;
  totalOvertimeHours?: number;
  overtimeRate?: number;
  totalPaidDays?: number;
  basePay?: number;
  overtimePay?: number;
  grossEarnings?: number;
  totalDeductions?: number;
  netPay?: number;
  payrollDetails?: Record<string, number>;
  status: "success" | "failed";
  error?: string;
}

export interface BulkPayrollCalculationResult {
  month: string;
  summary: {
    totalConfigured: number;
    totalCalculated: number;
    totalFailed: number;
    grandTotalNetPay: number;
    grandTotalPaidDays: number;
    grandTotalOvertimeHours: number;
    grandTotalOvertimePay: number;
  };
  results: BulkPayrollEmployeeItem[];
}

