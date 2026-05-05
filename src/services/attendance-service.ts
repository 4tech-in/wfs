import apiClient from '@/lib/api-client';
import { AttendanceResponse, AttendanceDashboardCount, AttendanceWithSummaryResponse, MarkManualAttendanceDto } from '@/types/attendance';
import { toast } from 'sonner';

/**
 * Attendance Service to handle attendance-related API operations
 */
export const attendanceService = {
  /**
   * Get all attendance records with pagination
   */
  getAll: async (page: number = 1, limit: number = 10, status?: string): Promise<AttendanceResponse> => {
    try {
      return await apiClient.get<void, AttendanceResponse>('/attendance', {
        params: { page, limit, status }
      });
    } catch (error: unknown) {
      toast.error('Failed to fetch attendance records');
      throw error;
    }
  },

  /**
   * Get attendance for a specific user filtered by month and year
   */
  getMonthlyAttendance: async (userId: string, month: string, year: string): Promise<AttendanceResponse> => {
    try {
      return await apiClient.get<void, AttendanceResponse>('/attendance', {
        params: { userId, month, year, limit: 100 } // Fetch more to cover a month
      });
    } catch (error: unknown) {
      toast.error('Failed to fetch monthly attendance');
      throw error;
    }
  },

  /**
   * Get dashboard attendance counts
   */
  getDashboardCount: async (): Promise<AttendanceDashboardCount> => {
    try {
      return await apiClient.get<void, AttendanceDashboardCount>('/attendance/dashboard-count');
    } catch (error: unknown) {
      toast.error('Failed to fetch attendance dashboard stats');
      throw error;
    }
  },

  /**
   * Get attendance records with summary for a date range
   */
  getWithSummary: async (
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    companyId?: string
  ): Promise<AttendanceWithSummaryResponse> => {
    try {
      return await apiClient.get<void, AttendanceWithSummaryResponse>('/attendance/with-summary', {
        params: { startDate, endDate, page, limit, status, companyId }
      });
    } catch (error: unknown) {
      toast.error('Failed to fetch attendance summary');
      throw error;
    }
  },

  /**
   * Upload attendance file
   * @param file - The file to upload
   */
  uploadAttendance: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post<FormData, void>('/attendance/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Attendance uploaded successfully');
    } catch (error) {
      const apiError = error as { data?: { message?: string }; message?: string };
      const errorMessage = apiError.data?.message || apiError.message || 'Failed to upload attendance';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Mark manual attendance for a user
   * @param data - The manual attendance data
   */
  markManualAttendance: async (data: MarkManualAttendanceDto): Promise<void> => {
    try {
      await apiClient.put<MarkManualAttendanceDto, void>('/attendance/mark-manual-attendance', data);
      toast.success('Attendance marked successfully');
    } catch (error: unknown) {
      toast.error('Failed to mark manual attendance');
      throw error;
    }
  },
  
  /**
   * Quick update attendance status
   * @param data - The mark attendance data
   */
  markAttendance: async (data: { userId: string; date: string; status: 'Present' | 'Absent' }): Promise<void> => {
    try {
      await apiClient.put('/attendance/update', data);
      toast.success(`Attendance updated to ${data.status}`);
    } catch (error: unknown) {
      toast.error('Failed to update attendance');
      throw error;
    }
  },
  
  /**
   * Quick update attendance status for multiple users
   * @param data - The mark attendance data for multiple users
   */
  updateMultipleAttendance: async (data: { userIds: string[]; date: string; status: string }): Promise<void> => {
    try {
      await apiClient.put('/attendance/update/multiple', data);
      toast.success('Multiple attendance marked successfully');
    } catch (error: unknown) {
      toast.error('Failed to mark multiple attendance');
      throw error;
    }
  },
};

export default attendanceService;
