import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salaryService } from "@/services/salary-service";
import { SalaryPayload, SalaryListResponse, PayrollCalculationResult, BulkPayrollCalculationResult } from "@/types/salary";

/**
 * Hook to fetch all employee salaries with pagination
 */
export function useSalariesQuery(page: number = 1, limit: number = 10) {
  return useQuery<SalaryListResponse>({
    queryKey: ['salaries', { page, limit }],
    queryFn: () => salaryService.getSalaries(page, limit),
  });
}

/**
 * Mutation hook to create or update employee salary
 */
export function useCreateSalaryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SalaryPayload) => salaryService.createSalary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
    },
  });
}

/**
 * Mutation hook to delete employee salary configuration
 */
export function useDeleteSalaryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => salaryService.deleteSalary(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
    },
  });
}

/**
 * Mutation hook to update employee salary configuration
 */
export function useUpdateSalaryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: SalaryPayload }) => 
      salaryService.updateSalary(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
    },
  });
}

/**
 * Hook to calculate employee salary for a specific month
 */
export function useCalculatePayrollQuery(employeeId: string, month: string) {
  return useQuery<PayrollCalculationResult>({
    queryKey: ['payroll-calculation', { employeeId, month }],
    queryFn: () => salaryService.calculatePayroll(employeeId, month),
    enabled: !!employeeId && !!month,
  });
}

/**
 * Mutation to calculate payroll for all employees
 */
export function useCalculateAllPayrollMutation() {
  return useMutation<BulkPayrollCalculationResult, Error, { month: string; companyId?: string }>({
    mutationFn: ({ month, companyId }) => salaryService.calculateAllPayroll(month, companyId),
  });
}

