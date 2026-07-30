import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { filesApi } from '@/src/api/files';
import type { CandidateFile } from '@/src/api/types';

export const fileKeys = {
  all: ['candidate-files'] as const,
  byApplication: (applicationId: string) => ['candidate-files', applicationId] as const,
};

export function useCandidateFiles(applicationId?: string) {
  const query = useQuery({
    queryKey: fileKeys.byApplication(applicationId ?? ''),
    queryFn: () => filesApi.findByApplication(applicationId!, { limit: 100 }),
    enabled: !!applicationId,
  });

  return {
    files: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Signed URLs are short-lived, so they are fetched at click time rather than
 * cached — a cached URL would eventually 403. `open` previews in a new tab;
 * otherwise the browser downloads via a synthetic anchor.
 */
export function useFileAction() {
  return useMutation({
    mutationFn: async ({ file, mode }: { file: CandidateFile; mode: 'download' | 'open' }) => {
      const res = await filesApi.getDownloadUrl(file.id);
      return { ...res.data, mode };
    },
    onSuccess: ({ url, fileName, mode }) => {
      if (mode === 'open') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 404) {
        toast.error('This file is no longer available.');
      } else if (status === 403) {
        toast.error('You do not have permission to access this file.');
      } else {
        toast.error(error?.response?.data?.message || 'Could not open the file. Please try again.');
      }
    },
  });
}

export function useFileUrl() {
  return useMutation({
    mutationFn: (file: CandidateFile) => filesApi.getDownloadUrl(file.id),
  });
}
