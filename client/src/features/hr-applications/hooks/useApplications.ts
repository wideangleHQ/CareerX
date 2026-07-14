import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import type { QueryApplicationsParams } from '@/src/api/types';

export function useApplications(params?: QueryApplicationsParams) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationsApi.findAll(params),
  });
}
export default useApplications;
