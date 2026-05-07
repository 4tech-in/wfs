import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance-service";
import { QUERY_KEYS } from "@/constants/query-keys";
import { 
  AttendanceResponse, 
  AttendanceDashboardCount, 
  AttendanceWithSummaryResponse,
  MarkManualAttendanceDto,
  MarkAttendanceDto 
} from "@/types/attendance";

/**
 * Hook to fetch all attendance records with pagination
 */
export function useAttendanceQuery(
  page: number = 1, 
  limit: number = 10, 
  status?: string, 
  options?: Partial<UseQueryOptions<AttendanceResponse>>
) {
  return useQuery<AttendanceResponse>({
    queryKey: [...QUERY_KEYS.attendance.list(), { page, limit, status }],
    queryFn: () => attendanceService.getAll(page, limit, status),
    ...options
  });
}

/**
 * Hook to fetch attendance with summary for a date range
 */
export function useAttendanceWithSummaryQuery(
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  companyId?: string,
  search?: string,
  options?: Partial<UseQueryOptions<AttendanceWithSummaryResponse>>
) {
  return useQuery<AttendanceWithSummaryResponse>({
    queryKey: QUERY_KEYS.attendance.withSummary({ startDate, endDate, page, limit, status, companyId, search }),
    queryFn: () => attendanceService.getWithSummary(startDate, endDate, page, limit, status, companyId, search),
    ...options
  });
}

/**
 * Hook to fetch attendance dashboard stats
 */
export function useAttendanceDashboardCountQuery(
  startDate?: string, 
  endDate?: string,
  options?: Partial<UseQueryOptions<AttendanceDashboardCount>>
) {
  return useQuery<AttendanceDashboardCount>({
    queryKey: [...QUERY_KEYS.attendance.dashboardCount(), { startDate, endDate }],
    queryFn: () => attendanceService.getDashboardCount(startDate, endDate),
    ...options
  });
}

/**
 * Hook to fetch monthly attendance for a specific user
 */
export function useMonthlyAttendanceQuery(userId: string, month: string, year: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.attendance.list(), 'monthly', { userId, month, year }],
    queryFn: () => attendanceService.getMonthlyAttendance(userId, month, year),
    enabled: !!userId && !!month && !!year,
  });
}

/**
 * Hook to mark manual attendance
 */
export function useMarkManualAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkManualAttendanceDto) => attendanceService.markManualAttendance(data),
    onSuccess: () => {
      // Invalidate attendance queries to refresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.stats() });
    },
  });
}

/**
 * Hook to mark quick attendance from dashboard
 */
export function useMarkAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkAttendanceDto) => attendanceService.markAttendance(data),
    onSuccess: () => {
      // Invalidate attendance queries to refresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.stats() });
    },
  });
}

/**
 * Hook to mark attendance for multiple users
 */
export function useUpdateMultipleAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userIds: string[]; date: string; status: string }) => 
      attendanceService.updateMultipleAttendance(data),
    onSuccess: () => {
      // Invalidate attendance queries to refresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.stats() });
    },
  });
}
