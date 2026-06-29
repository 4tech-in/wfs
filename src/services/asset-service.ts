import apiClient from '@/lib/api-client';
import { 
  Asset, 
  CreateAssetDto, 
  UpdateAssetDto, 
  AssetsResponse, 
  AssetQueryParams, 
  AssetTrackingHistory, 
  CreateAssetTrackingDto, 
  AssetTrackingHistoryResponse 
} from '@/types/asset';
import { toast } from 'sonner';

/**
 * Asset Service to handle asset-related API operations
 */
export const assetService = {
  /**
   * Create a new asset
   */
  create: async (data: CreateAssetDto): Promise<Asset> => {
    try {
      const response = await apiClient.post<{ data: Asset }, { data: Asset }>('/assets', data);
      toast.success('Asset created successfully');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create asset';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Get all assets with optional filtering and search
   */
  getAll: async (params?: AssetQueryParams): Promise<AssetsResponse> => {
    try {
      const response = await apiClient.get<void, AssetsResponse>('/assets', { 
        params: { ...params, limit: 100 } 
      });
      return response;
    } catch (error: unknown) {
      toast.error('Failed to fetch assets');
      throw error;
    }
  },

  /**
   * Get an asset by ID
   */
  getById: async (id: string): Promise<Asset> => {
    try {
      const response = await apiClient.get<void, { data: Asset }>(`/assets/${id}`);
      return response.data;
    } catch (error: unknown) {
      toast.error('Failed to fetch asset details');
      throw error;
    }
  },

  /**
   * Update an existing asset
   */
  update: async (id: string, data: UpdateAssetDto): Promise<Asset> => {
    try {
      const response = await apiClient.patch<{ data: Asset }, { data: Asset }>(`/assets/${id}`, data);
      toast.success('Asset updated successfully');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update asset';
      toast.error(errorMessage);
      throw error;
    }
  },

  unassign: async (id: string): Promise<unknown> => {
    try {
      const response = await apiClient.post<void, unknown>(`/assets/unassign/${id}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unassign asset';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete an asset
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/assets/${id}`);
      toast.success('Asset deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete asset';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Get asset tracking history
   */
  getHistory: async (id: string, params?: AssetQueryParams): Promise<AssetTrackingHistoryResponse> => {
    try {
      const response = await apiClient.get<void, AssetTrackingHistoryResponse>(`/track-assets/asset/${id}`, { 
        params: { ...params, limit: 100 } 
      });
      return response;
    } catch (error: unknown) {
      toast.error('Failed to fetch asset history');
      throw error;
    }
  },

  /**
   * Create asset tracking record
   */
  createTrackingRecord: async (data: CreateAssetTrackingDto): Promise<AssetTrackingHistory> => {
    try {
      const formData = new FormData();
      formData.append('amount', data.amount.toString());
      formData.append('description', data.description);
      formData.append('assetId', data.assetId);
      
      if (data.images) {
        data.images.forEach((file) => {
          formData.append('images', file);
        });
      }

      const response = await apiClient.post<{ data: AssetTrackingHistory }, { data: AssetTrackingHistory }>(`/track-assets/asset/${data.assetId}`, formData);
      toast.success('Tracking record added successfully');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add tracking record';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete asset tracking record
   */
  deleteTrackingRecord: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/track-assets/${id}`);
      toast.success('Tracking record deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tracking record';
      toast.error(errorMessage);
      throw error;
    }
  },
};

export default assetService;
