import apiClient from '@/lib/api-client';
import { Asset, CreateAssetDto, UpdateAssetDto, AssetsResponse, AssetQueryParams } from '@/types/asset';
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
      const response = await apiClient.get<void, AssetsResponse>('/assets', { params });
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
};

export default assetService;
