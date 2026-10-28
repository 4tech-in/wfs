import apiClient from '@/lib/api-client';
import { DocCenterResponse, DocCenterQueryParams, CreateDocDto, DeleteFilesDto, UpdateDocFilesDto, DocumentItem } from '@/types/doc-center';
import { toast } from 'sonner';

/**
 * Document Center Service to handle document-related API operations
 */
export const docCenterService = {
  /**
   * Get all documents with optional filtering and search
   */
  getAll: async (params?: DocCenterQueryParams): Promise<DocCenterResponse> => {
    try {
      const response = await apiClient.get<void, DocCenterResponse>('/doccenter', { params });
      return response;
    } catch (error: unknown) {
      toast.error('Failed to fetch documents');
      throw error;
    }
  },

  /**
   * Get a single document by ID
   */
  getById: async (id: string): Promise<DocumentItem> => {
    try {
      const response = await apiClient.get<void, DocumentItem>(`/doccenter/${id}`);
      return response;
    } catch (error: unknown) {
      toast.error('Failed to fetch document details');
      throw error;
    }
  },

  /**
   * Create a new document (Upload)
   * Uses FormData for multipart/form-data support
   */
  create: async (data: CreateDocDto): Promise<unknown> => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('documentType', data.documentType);
      
      // Append multiple files
      if (Array.isArray(data.files)) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      } else {
        formData.append('files', data.files);
      }

      // Append metadata fields individually if they exist
      if (data.metadata) {
        Object.entries(data.metadata).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      }
      const response = await apiClient.post<FormData, unknown>('/doccenter', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Document uploaded successfully');
      return response;
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      const errorMessage = err?.data?.message || err?.message || 'Failed to upload document';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void, void>(`/doccenter/${id}`);
      toast.success('Document deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Delete specific files from a document
   */
  deleteFiles: async (data: DeleteFilesDto): Promise<void> => {
    try {
      await apiClient.post<DeleteFilesDto, void>('/doccenter/delete-files', data);
      toast.success('Files deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete files';
      toast.error(errorMessage);
      throw error;
    }
  },
  /**
   * Add more files to an existing document
   */
  updateFiles: async (data: UpdateDocFilesDto): Promise<void> => {
    try {
      const formData = new FormData();
      data.files.forEach((file) => {
        formData.append('files', file);
      });

      await apiClient.patch<FormData, void>(`/doccenter/${data.documentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Files added successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add files';
      toast.error(errorMessage);
      throw error;
    }
  },
  /**
   * Update an existing document (Patch)
   */
  patch: async (id: string, data: { title?: string; documentType?: string; files?: File[]; metadata?: Record<string, unknown> }): Promise<unknown> => {
    try {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.documentType) formData.append('documentType', data.documentType);
      
      if (data.metadata) {
        formData.append('metadata', JSON.stringify(data.metadata));
      }

      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await apiClient.patch<FormData, unknown>(`/doccenter/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Document updated successfully');
      return response;
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      const errorMessage = err?.data?.message || err?.message || 'Failed to update document';
      toast.error(errorMessage);
      throw error;
    }
  },
};

export default docCenterService;
