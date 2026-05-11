import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/asset-service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { CreateAssetDto, UpdateAssetDto, AssetQueryParams } from '@/types/asset';

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
    mutationFn: (data: CreateAssetDto) => assetService.create(data),
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
