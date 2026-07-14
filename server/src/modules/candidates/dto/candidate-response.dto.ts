export interface CandidateResponseDto {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  whatsappNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateListItemDto {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  createdAt: Date;
}

export interface CandidateMutationResponseDto {
  success: true;
  message: string;
  data: CandidateResponseDto;
}

export interface CandidateListResponseDto {
  success: true;
  data: CandidateListItemDto[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}
