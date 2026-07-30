import axiosClient from './client';
import type { CandidateFile, CandidateFileListResponse, SignedUrlResponse } from './types';

export const filesApi = {
  // Metadata only — the API never returns storage paths.
  findByApplication: async (
    applicationId: string,
    params?: { cursor?: string; limit?: number; fileType?: CandidateFile['fileType'] }
  ): Promise<CandidateFileListResponse> => {
    const { data } = await axiosClient.get(`/api/v1/files/application/${applicationId}`, { params });
    return data;
  },

  // Signed URL is minted server-side, on demand, and is short-lived.
  getDownloadUrl: async (fileId: string): Promise<SignedUrlResponse> => {
    const { data } = await axiosClient.get(`/api/v1/files/${fileId}/download-url`);
    return data;
  },
};
