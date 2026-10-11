import apiClient from '@/lib/api-client';
import { VehiclesResponse, VehicleQueryParams, Vehicle } from '@/types/vehicle';
import { toast } from 'sonner';

export interface CreateVehicleDto {
  vehicleNo: string;
  vehicleCode: string;
  fuelType?: string;
}

/**
 * Vehicle Service to handle vehicle-related API operations
 */
export const vehicleService = {
  /**
   * Get all vehicles with optional filtering and search
   */
  getAll: async (params?: VehicleQueryParams): Promise<VehiclesResponse> => {
    try {
      return await apiClient.get<void, VehiclesResponse>('/vehicle', { params });
    } catch (error: unknown) {
      toast.error('Failed to fetch vehicles');
      throw error;
    }
  },

  /**
   * Create a new vehicle
   */
  create: async (data: CreateVehicleDto): Promise<Vehicle> => {
    try {
      const response = await apiClient.post<{ data: Vehicle }, { data: Vehicle }>('/vehicle', data);
      toast.success('Vehicle added successfully');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add vehicle';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Update a vehicle
   */
  update: async (id: string, data: Partial<CreateVehicleDto>): Promise<Vehicle> => {
    try {
      const response = await apiClient.patch<{ data: Vehicle }, { data: Vehicle }>(`/vehicle/${id}`, data);
      toast.success('Vehicle updated successfully');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete a vehicle
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/vehicle/${id}`);
      toast.success('Vehicle deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle';
      toast.error(errorMessage);
      throw error;
    }
  },
};

export default vehicleService;
