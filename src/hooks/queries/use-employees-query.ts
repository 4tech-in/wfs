import { useInfiniteQuery, useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { employeeService } from '@/services/employee-service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { RegisterEmployeeDto, UpdateEmployeeDto, EmployeeQueryParams, EmployeesResponse, EmployeeStatsResponse, Employee } from '@/types/employee';

/**
 * Hook to fetch employee stats for the dashboard
 */
export function useEmployeeStatsQuery() {
  return useQuery<EmployeeStatsResponse>({
    queryKey: QUERY_KEYS.users.stats(),
    queryFn: () => employeeService.getStats(),
  });
}

/**
 * Hook to fetch employees with pagination and filters
 */
export function useEmployeesQuery(params?: EmployeeQueryParams, options?: Partial<UseQueryOptions<EmployeesResponse>>) {
  return useQuery<EmployeesResponse>({
    queryKey: [...QUERY_KEYS.users.all, 'list', params],
    queryFn: () => employeeService.getAll(params),
    ...options
  });
}

/**
 * Hook to fetch employees with infinite scrolling
 */
export function useEmployeesInfiniteQuery(params?: EmployeeQueryParams) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.users.all, 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      employeeService.getAll({ ...params, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}

/**
 * Hook to fetch employees for dropdown with infinite scrolling
 */
export function useEmployeesDropdownInfiniteQuery(params?: EmployeeQueryParams, enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.users.all, 'dropdown', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      employeeService.getDropdown({ ...params, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}

/**
 * Hook to fetch the employee-id dropdown (punch machine IDs) with infinite scrolling
 */
export function useEmployeeIdInfiniteQuery(params?: EmployeeQueryParams, enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.users.all, 'employee-id', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      employeeService.getEmployeeIdDropdown({ ...params, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}

/**
 * Hook to fetch a single employee by ID
 */
export function useEmployeeQuery(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.users.detail(id || ''),
    queryFn: () => employeeService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch the employee-id dropdown (punch machine IDs)
 */
export function useEmployeeIdDropdownQuery(params?: EmployeeQueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.users.all, 'employee-id-dropdown', params],
    queryFn: () => employeeService.getEmployeeIdDropdown(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to register a new employee
 */
export function useRegisterEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterEmployeeDto | FormData) => employeeService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}

/**
 * Hook to update an existing employee
 */
export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto | FormData }) =>
      employeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}

/**
 * Hook to delete an employee
 */
export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    },
  });
}

/**
 * Hook to create new employee ID(s)
 */
export function useCreateEmployeeIdMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { prefix: string; remark: string; count?: number }) => employeeService.createEmployeeId(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.users.all, 'employee-id-dropdown'] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.users.all, 'employee-id'] });
    },
  });
}

/**
 * Hook to fetch all deleted employees
 */
export function useDeletedEmployeesQuery() {
  return useQuery<Employee[]>({
    queryKey: [...QUERY_KEYS.users.all, 'deleted'],
    queryFn: () => employeeService.getDeletedUsers(),
  });
}
