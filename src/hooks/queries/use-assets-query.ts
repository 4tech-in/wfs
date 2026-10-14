import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/asset-service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { CreateAssetDto, UpdateAssetDto, AssetQueryParams, CreateAssetTrackingDto } from '@/types/asset';

/**
 * Hook to fetch assets with optional filtering and search
 */
export function useAssetsQuery(params?: AssetQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.assets.list(params),
    queryFn: () => assetService.getAll(params),
  });
}

/**
 * Hook to fetch a single asset by ID
 */
export function useAssetQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.assets.detail(id),
    queryFn: () => assetService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new asset
 */
export function useCreateAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAssetDto | CreateAssetDto[]) => assetService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all });
    },
  });
}

/**
 * Hook to update an existing asset
 */
export function useUpdateAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetDto }) => 
      assetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all });
    },
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all });
    },
  });
}

/**
 * Hook to fetch asset tracking history
 */
export function useAssetHistoryQuery(id: string, params?: AssetQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.assets.history(id, params),
    queryFn: () => assetService.getHistory(id, params),
    enabled: !!id,
  });
}

/**
 * Hook to create a new asset tracking record
 */
export function useCreateAssetTrackingMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAssetTrackingDto) => assetService.createTrackingRecord(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.history(variables.assetId) });
    },
  });
}

/**
 * Hook to delete an asset tracking record
 */
export function useDeleteAssetTrackingMutation(assetId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => assetService.deleteTrackingRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.history(assetId) });
    },
  });
}
