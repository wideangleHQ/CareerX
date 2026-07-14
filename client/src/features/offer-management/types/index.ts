export type { Offer, OfferStatus, QueryOffersParams, OfferListResponse, OfferStats } from '@/src/api/types';

export interface OfferFiltersState {
  search: string;
  status: string;
  departmentId: string;
  opportunityId: string;
  assignedHrId: string;
}
