import type { application_status_enum } from '@prisma/client';

export interface ApplicationListItemDto {
  id: string;
  applicationCode: string;
  status: application_status_enum;
  candidate: { id: string; fullName: string; email: string; mobileNumber: string };
  department: { id: string; name: string };
  assignedHr: { id: string; fullName: string; email: string } | null;
  opportunity: { id: string; title: string; internalPosition: string; priority: string } | null;
  interviewStatus: 'NOT_SCHEDULED' | 'SCHEDULED' | 'FEEDBACK_SUBMITTED';
  interviewDate: Date | null;
  interviewTime: Date | null;
  interviewer: { id: string; fullName: string } | null;
  resumeFile: { id: string; fileName: string; mimeType: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationDetailDto extends ApplicationListItemDto {
  selfDescription: string;
  rejectionReason: string | null;
  notesCount: number;
  latestInterviewStatus: string | null;
  files: Array<{
    id: string;
    fileName: string;
    fileType: string;
    bucket: string;
    fileSizeKb: number | null;
    mimeType: string | null;
    createdAt: Date;
  }>;
  slotAssignment: {
    id: string;
    applicationId: string;
    slotId: string;
    assignedHrId: string;
    assignedAt: Date;
    slot: { id: string; slotDate: Date; slotTime: Date };
    assignedHr: { id: string; fullName: string; email: string };
  } | null;
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
