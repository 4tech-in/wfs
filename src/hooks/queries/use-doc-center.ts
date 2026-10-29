import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { docCenterService } from '@/services/doc-center-service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { DocCenterQueryParams, CreateDocDto, DeleteFilesDto, UpdateDocFilesDto } from '@/types/doc-center';

/**
 * Hook to fetch documents with optional filtering and search
 */
export function useDocCenterQuery(params?: DocCenterQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.docCenter.list(params),
    queryFn: () => docCenterService.getAll(params),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch a single document by ID
 */
export function useSingleDocQuery(id: string) {
  return useQuery({
    queryKey: ['doc-center', 'detail', id],
    queryFn: () => docCenterService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to upload a new document
 */
export function useUploadDocMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDocDto) => docCenterService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.docCenter.all });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => docCenterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.docCenter.all });
    },
  });
}

/**
 * Hook to delete specific files from a document
 */
export function useDeleteFilesMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: DeleteFilesDto) => docCenterService.deleteFiles(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.docCenter.all });
    },
  });
}

/**
 * Hook to add more files to an existing document
 */
export function useUpdateDocFilesMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateDocFilesDto) => docCenterService.updateFiles(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.docCenter.all });
    },
  });
}
/**
 * Hook to update an existing document (Patch)
 */
export function useUpdateDocMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; documentType?: string; files?: File[]; metadata?: Record<string, unknown> } }) => 
      docCenterService.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.docCenter.all });
    },
  });
}
