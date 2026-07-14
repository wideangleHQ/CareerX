import type { application_status_enum } from '@prisma/client';

export interface ApplicationListItemDto {
  id: string;
  applicationCode: string;
  status: application_status_enum;
  candidate: { id: string; fullName: string; email: string; mobileNumber: string };
  department: { id: string; name: string };
  assignedHr: { id: string; fullName: string; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationDetailDto extends ApplicationListItemDto {
  selfDescription: string;
  rejectionReason: string | null;
  notesCount: number;
  latestInterviewStatus: string | null;
}

export interface ApplicationMutationResponseDto {
  success: true;
  message: string;
  data: ApplicationDetailDto;
}

export interface ApplicationListResponseDto {
  success: true;
  data: ApplicationListItemDto[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}
