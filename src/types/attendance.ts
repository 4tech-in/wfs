/**
 * Attendance status types
 */
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'On Leave';

export type ManualAttendanceStatus = 'Present' | 'Absent' | 'Half-Day' | 'WeeklyOff' | 'Holiday';

/**
 * Payload for marking manual attendance
 */
export interface MarkManualAttendanceDto {
  userId: string;
  date: string;
  status: ManualAttendanceStatus;
  punchIn?: string | null;
  punchOut?: string | null;
}

/**
 * Payload for marking quick attendance from dashboard
 */
export interface MarkAttendanceDto {
  userIds: string[];
  date: string;
  status: 'Present' | 'Absent';
  punchIn?: string | null;
  punchOut?: string | null;
}

/**
 * Single attendance record based on real API response
 */
export interface Attendance {
  _id: string;
  userId: {
    _id: string;
    name: string;
    otherName?: string;
    email: string;
    employeeId?: string;
    designation?: string;
    company?: {
      _id: string;
      name: string;
    };
    companyName?: string; // Keep for backward compatibility if needed
  };
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  status: AttendanceStatus;
  totalWorkedMinutes: number;
  overtimeHours: number;
  overtimePay: number;
  uniqueId: number;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

/**
 * Interface for a user with their optional attendance for a specific day
 * This matches the new /attendance/with-summary response structure
 */
export interface UserAttendanceItem {
  user: {
    _id: string;
    name: string;
    otherName?: string;
    email: string;
    employeeId?: string;
    designation?: string;
    company?: {
      _id: string;
      name: string;
    };
    companyName?: string; // Keep for backward compatibility if needed
  };
  attendance: Attendance | null;
  status: string;
}

/**
 * API response for attendance list matching real response
 */
export interface AttendanceResponse {
  data: Attendance[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interface for dashboard attendance counts
 */
export interface AttendanceDashboardCount {
  startDate: string;
  endDate: string;
  totalUsers: number;
  present: number;
  absent: number;
  onLeave: number;
  notMarked: number;
}

/**
 * Interface for attendance summary in filtered reports
 */
export interface AttendanceSummary {
  totalUsers: number;
  present: number;
  absent: number;
  onLeave: number;
  notMarked: number;
}

/**
 * Interface for attendance with summary response
 */
export interface AttendanceWithSummaryResponse {
  summary: AttendanceSummary;
  data: UserAttendanceItem[];
  total: number;
  page: number;
  limit: number;
  startDate: string;
  endDate: string;
}

/**
 * Initial data for manual attendance dialog
 */
export interface ManualAttendanceInitialData {
  companyId?: string;
  employeeId?: string;
  date?: Date;
  status?: string;
  punchIn?: string | null;
  punchOut?: string | null;
}
