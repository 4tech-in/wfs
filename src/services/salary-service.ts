import apiClient from '@/lib/api-client';
import { SalaryPayload, SalaryListResponse, PayrollCalculationResult, BulkPayrollCalculationResult } from '@/types/salary';
import { toast } from 'sonner';

/**
 * Salary Service to handle all salary-related API operations
 */
export const salaryService = {
  /**
   * Create or update employee salary configuration
   */
  createSalary: async (data: SalaryPayload): Promise<void> => {
    try {
      const response: any = await apiClient.post<SalaryPayload, any>('/employee-salary/add', data);
      const count = data.userIds?.length;
      toast.success(
        response?.message ||
        (count && count > 1
          ? `Salary configured for ${count} employees`
          : 'Salary configured successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update salary';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Get all employee salaries with pagination
   */
  getSalaries: async (page: number = 1, limit: number = 10): Promise<SalaryListResponse> => {
    try {
      return await apiClient.get<void, SalaryListResponse>('/employee-salary/get', {
        params: { page, limit }
      });
    } catch (error: unknown) {
      toast.error('Failed to fetch salaries');
      throw error;
    }
  },

  /**
   * Delete an employee salary configuration
   */
  deleteSalary: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/employee-salary/delete/${userId}`);
      toast.success('Salary configuration deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete salary';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update an employee salary configuration
   */
  updateSalary: async (userId: string, data: SalaryPayload): Promise<void> => {
    try {
      await apiClient.put<SalaryPayload, void>(`/employee-salary/update/${userId}`, data);
      toast.success('Salary configuration updated');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update salary';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Calculate employee salary for a specific month
   */
  calculatePayroll: async (employeeId: string, month: string): Promise<PayrollCalculationResult> => {
    try {
      return await apiClient.get<void, PayrollCalculationResult>('/employee-salary/calculate', {
        params: { employeeId, month }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate salary';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Calculate salary for all configured employees for a specific month
   */
  calculateAllPayroll: async (month: string, companyId?: string): Promise<BulkPayrollCalculationResult> => {
    try {
      return await apiClient.get<void, BulkPayrollCalculationResult>('/employee-salary/calculate-all', {
        params: { month, companyId: companyId || undefined }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate bulk payroll';
      toast.error(errorMessage);
      throw error;
    }
  },
};

export default salaryService;
