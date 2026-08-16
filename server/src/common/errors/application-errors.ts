import {
  BadRequestException,
  ConflictException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';

export const ApplicationErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DEPARTMENT: 'INVALID_DEPARTMENT',
  OPPORTUNITY_UNAVAILABLE: 'OPPORTUNITY_UNAVAILABLE',
  DEADLINE_PASSED: 'DEADLINE_PASSED',
  RESUME_REQUIRED: 'RESUME_REQUIRED',
  APPLICATION_ALREADY_EXISTS: 'APPLICATION_ALREADY_EXISTS',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  INVALID_INTERVIEW_SLOT: 'INVALID_INTERVIEW_SLOT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  DOCUMENT_UPLOAD_FAILED: 'DOCUMENT_UPLOAD_FAILED',
  SUBMISSION_FAILED: 'SUBMISSION_FAILED',
} as const;

export type ApplicationErrorCode = (typeof ApplicationErrorCode)[keyof typeof ApplicationErrorCode];

const CANDIDATE_MESSAGES: Record<ApplicationErrorCode, string> = {
  VALIDATION_ERROR: 'Please check your details and try again.',
  INVALID_DEPARTMENT: 'The selected department is not available. Please choose another.',
  OPPORTUNITY_UNAVAILABLE: 'This position is no longer accepting applications.',
  DEADLINE_PASSED: 'The application deadline for this position has passed.',
  RESUME_REQUIRED: 'A resume file is required for this application.',
  APPLICATION_ALREADY_EXISTS: 'You have already applied for this position.',
  SLOT_UNAVAILABLE: 'This interview slot is no longer available. Please select another time.',
  INVALID_INTERVIEW_SLOT: 'The selected interview slot is no longer valid. Please select another time.',
  FILE_TOO_LARGE: 'The uploaded file exceeds the maximum allowed size.',
  FILE_TYPE_NOT_ALLOWED: 'The uploaded file type is not accepted. Please upload a PDF, DOC, or DOCX file.',
  DOCUMENT_UPLOAD_FAILED: "We couldn't upload your document right now. Please try again.",
  SUBMISSION_FAILED: 'We could not process your application right now. Please try again later.',
};

export function candidateError(
  code: ApplicationErrorCode,
  fieldErrors?: Record<string, string>,
): never {
  const message = CANDIDATE_MESSAGES[code];
  const body = { success: false as const, code, message, ...(fieldErrors ? { fields: fieldErrors } : {}) };

  switch (code) {
    case ApplicationErrorCode.FILE_TOO_LARGE:
      throw new PayloadTooLargeException(body);
    case ApplicationErrorCode.VALIDATION_ERROR:
    case ApplicationErrorCode.INVALID_DEPARTMENT:
    case ApplicationErrorCode.RESUME_REQUIRED:
    case ApplicationErrorCode.FILE_TYPE_NOT_ALLOWED:
      throw new BadRequestException(body);
    case ApplicationErrorCode.OPPORTUNITY_UNAVAILABLE:
    case ApplicationErrorCode.DEADLINE_PASSED:
    case ApplicationErrorCode.APPLICATION_ALREADY_EXISTS:
    case ApplicationErrorCode.SLOT_UNAVAILABLE:
    case ApplicationErrorCode.INVALID_INTERVIEW_SLOT:
      throw new ConflictException(body);
    case ApplicationErrorCode.DOCUMENT_UPLOAD_FAILED:
    case ApplicationErrorCode.SUBMISSION_FAILED:
      throw new UnprocessableEntityException(body);
  }
}
