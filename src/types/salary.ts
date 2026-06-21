export type SalaryType = 'monthly' | 'hourly' | 'daily';

export interface SalaryPayload {
  userId: string;
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
  month: string;
  totalWorkedMinutes: number;
  totalOvertimeHours: number;
  totalPaidDays: number;
  basePay: number;
  overtimePay: number;
  netPay: number;
  payrollDetails: {
    basic: number;
    hra: number;
    pfEmployee: number;
    [key: string]: number; // Support additional fields if any
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
