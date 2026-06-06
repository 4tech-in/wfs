import apiClient from '@/lib/api-client';
import { FuelCardStats, FuelExpensesResponse, FuelQueryParams, CreateFuelDto, FuelCardsResponse } from '@/types/fuel';
import { toast } from 'sonner';

/**
 * Fuel Service to handle fuel-related API operations
 */
export const fuelService = {
  /**
   * Get all fuel expenses
   */
  getAll: async (params?: FuelQueryParams): Promise<FuelExpensesResponse> => {
    try {
      return await apiClient.get<void, FuelExpensesResponse>('/fuel', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch fuel expenses');
      throw error;
    }
  },

  /**
   * Create a new fuel expense
   */
  create: async (data: CreateFuelDto): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('vehicleId', data.vehicleId);
      formData.append('odometer', String(data.odometer));
      formData.append('fuelType', data.fuelType);
      formData.append('ratePerLtr', String(data.ratePerLtr));
      formData.append('totalAmount', String(data.totalAmount));
      formData.append('fillingDate', data.fillingDate);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((file) => {
          formData.append('images', file);
        });
      }

      await apiClient.post<FormData, void>('/fuel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Fuel expense logged successfully');
    } catch (error: unknown) {
      toast.error('Failed to log fuel expense');
      throw error;
    }
  },

  /**
   * Update a fuel expense
   */
  update: async (id: string, data: CreateFuelDto): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('vehicleId', data.vehicleId);
      formData.append('odometer', String(data.odometer));
      formData.append('fuelType', data.fuelType);
      formData.append('ratePerLtr', String(data.ratePerLtr));
      formData.append('totalAmount', String(data.totalAmount));
      formData.append('fillingDate', data.fillingDate);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((file) => {
          formData.append('images', file);
        });
      }

      await apiClient.patch<FormData, void>(`/fuel/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Fuel record updated successfully');
    } catch (error: unknown) {
      toast.error('Failed to update fuel record');
      throw error;
    }
  },

  /**
   * Delete a fuel expense
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/fuel/${id}`);
      toast.success('Fuel record deleted successfully');
    } catch (error: unknown) {
      toast.error('Failed to delete fuel record');
      throw error;
    }
  },

  /**
   * Get fuel card statistics
   */
  getStats: async (): Promise<FuelCardStats> => {
    try {
      return await apiClient.get<void, FuelCardStats>('/fuel-card/stats');
    } catch (error: unknown) {
      toast.error('Failed to fetch fuel card statistics');
      throw error;
    }
  },

  /**
   * Add balance to fuel card
   */
  addCardBalance: async (data: { amount: number; note?: string }): Promise<void> => {
    try {
      await apiClient.post<void, void>('/fuel-card', data);
      toast.success('Card balance added successfully');
    } catch (error: unknown) {
      toast.error('Failed to add card balance');
      throw error;
    }
  },

  /**
   * Get all fuel card balance additions (transactions)
   */
  getFuelCards: async (params?: Record<string, unknown>): Promise<FuelCardsResponse> => {
    try {
      return await apiClient.get<void, FuelCardsResponse>('/fuel-card', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch recharge history');
      throw error;
    }
  },

  /**
   * Update a fuel card balance entry
   */
  updateCardBalance: async (id: string, data: { amount: number; note?: string }): Promise<void> => {
    try {
      await apiClient.patch(`/fuel-card/${id}`, data);
      toast.success('Card balance updated successfully');
    } catch (error: unknown) {
      toast.error('Failed to update card balance');
      throw error;
    }
  },

  /**
   * Delete a fuel card balance entry
   */
  deleteCardBalance: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/fuel-card/${id}`);
      toast.success('Card balance record deleted successfully');
    } catch (error: unknown) {
      toast.error('Failed to delete card balance record');
      throw error;
    }
  },
};

export default fuelService;
