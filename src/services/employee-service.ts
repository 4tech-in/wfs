import apiClient from '@/lib/api-client';
import {
  EmployeesResponse,
  RegisterEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryParams,
  Employee,
  EmployeeDropdownResponse,
  EmployeeStatsResponse
} from '@/types/employee';
import { toast } from 'sonner';

/**
 * Employee Service to handle all employee-related API operations
 */
export const employeeService = {
  /**
   * Get all employees with optional filters and pagination
   */
  getAll: async (params?: EmployeeQueryParams): Promise<EmployeesResponse> => {
    try {
      return await apiClient.get<void, EmployeesResponse>('/user/get-all', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch employees');
      throw error;
    }
  },

  /**
   * Get employee dropdown list
   */
  getDropdown: async (params?: EmployeeQueryParams): Promise<EmployeeDropdownResponse> => {
    try {
      return await apiClient.get<void, EmployeeDropdownResponse>('/user/get-dropdown', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch employee dropdown');
      throw error;
    }
  },

  /**
   * Register a new employee
   */
  register: async (data: RegisterEmployeeDto | FormData): Promise<void> => {
    try {
      await apiClient.post<RegisterEmployeeDto | FormData, void>('/user/register', data);
      toast.success('Employee registered successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register employee';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update an existing employee
   */
  update: async (id: string, data: UpdateEmployeeDto | FormData): Promise<void> => {
    try {
      await apiClient.put<UpdateEmployeeDto | FormData, void>(`/user/update/${id}`, data);
      toast.success('Employee updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete an employee
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/user/delete/${id}`);
      toast.success('Employee deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Get an employee by ID
   */
  getById: async (id: string): Promise<Employee> => {
    try {
      return await apiClient.get<void, Employee>(`/user/get/${id}`);
    } catch (error: unknown) {
      toast.error('Failed to fetch employee details');
      throw error;
    }
  },

  /**
   * Get the employee-id dropdown list (punch machine IDs)
   */
  getEmployeeIdDropdown: async (params?: EmployeeQueryParams): Promise<{
    data: { _id: string; employeeId: string; remark: string; createdAt: string; updatedAt: string }[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    try {
      return await apiClient.get('/employee-id/dropdown', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch employee IDs');
      throw error;
    }
  },

  /**
   * Create new employee ID(s)
   */
  createEmployeeId: async (data: { prefix: string; remark: string; count?: number }): Promise<void> => {
    try {
      const total = data.count || 1;
      const payload = { prefix: data.prefix, remark: data.remark };

      for (let i = 0; i < total; i++) {
        await apiClient.post<{ prefix: string; remark: string }, void>('/employee-id', payload);
      }

      toast.success(`${total} Employee ID(s) generated successfully`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate employee IDs';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Get employee statistics
   */
  getStats: async (): Promise<EmployeeStatsResponse> => {
    try {
      return await apiClient.get<void, EmployeeStatsResponse>('/user/stats');
    } catch (error: unknown) {
      toast.error('Failed to fetch employee statistics');
      throw error;
    }
  },

  /**
   * Bulk upload employees from Excel file
   */
  bulkUpload: async (file: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post<FormData, void>('/user/bulk-upload', formData);
      toast.success('Bulk upload successful');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload employees';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  /**
   * Get all deleted employees
   */
  getDeletedUsers: async (): Promise<Employee[]> => {
    try {
      return await apiClient.get<void, Employee[]>('/user/get-deleted-users');
    } catch (error: unknown) {
      toast.error('Failed to fetch deleted employees');
      throw error;
    }
  },

  /**
   * Restore a deleted employee
   */
  restore: async (id: string): Promise<void> => {
    try {
      await apiClient.put<void, void>(`/user/restore-user/${id}`);
      toast.success('Employee restored successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore employee';
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteMultiple: async (data: { userIds: string[]; companyExitDate: string }): Promise<void> => {
    try {
      await apiClient.post<{ userIds: string[]; companyExitDate: string }, void>('/user/delete-multiple-users', data);
      toast.success('Employees deleted successfully');
    } catch (error: unknown) {
      const err = error as { data?: { assets?: unknown } };
      const hasAssets = err && typeof err === 'object' && err.data && typeof err.data === 'object' && 'assets' in err.data;
      if (!hasAssets) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete employees';
        toast.error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Get employee statistics with gender distribution, filtered by companies and departments
   */
  getStatsWithGender: async (params: { companyIds?: string; departmentIds?: string }): Promise<EmployeeStatsResponse> => {
    try {
      return await apiClient.get<void, EmployeeStatsResponse>('/user/stats-with-gender', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch gender statistics');
      throw error;
    }
  },
};

export default employeeService;
