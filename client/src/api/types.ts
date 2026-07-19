export type ApplicationStatus =
  | 'NEW'
  | 'SLOT_BOOKED'
  | 'INTERVIEWED'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type CandidateFileType =
  | 'RESUME'
  | 'ORG_PROOF'
  | 'CERTIFICATE'
  | 'OFFER_LETTER'
  | 'JOINING_LETTER'
  | 'OTHER';

export type PermissionType =
  | 'CAREER_VIEW'
  | 'CAREER_EDIT'
  | 'CAREER_EXPORT'
  | 'CAREER_ADMIN'
  | 'CAREER_REPORTS'
  | 'CAREER_INTERVIEW';

export interface User {
  sub: string;
  email: string;
  departmentId: string | null;
  permissions: PermissionType[];
  canAccessCareerHR?: boolean;
}

export interface Department {
  id: string;
  name: string;
  is_hiring_enabled: boolean;
  synced_at: string;
}

export interface HrEmployee {
  id: string;
  full_name: string;
  email: string;
  department_id: string | null;
  performx_role: string;
  is_active: boolean;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  whatsapp_number: string | null;
  created_at: string;
}

export interface CandidateFile {
  id: string;
  application_id: string;
  file_type: CandidateFileType;
  file_name: string;
  storage_path: string;
  file_size_kb: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface InterviewSlot {
  id: string;
  slotDate: string;
  slotTime: string;
  isBooked: boolean;
  isRecurring: boolean;
  hr: { id: string; fullName: string; email: string };
  department: { id: string; name: string } | null;
}

export interface SlotAssignment {
  id: string;
  application_id: string;
  slot_id: string;
  assigned_hr_id: string;
  assigned_at: string;
  slot?: InterviewSlot;
  assigned_hr?: HrEmployee;
}

export interface InterviewFeedback {
  id: string;
  application_id: string;
  hr_id: string;
  rating: number;
  notes: string | null;
  created_at: string;
  hr?: HrEmployee;
}

export interface HrNote {
  id: string;
  application_id: string;
  hr_id: string;
  note: string;
  created_at: string;
  hr?: HrEmployee;
}

export interface StatusHistory {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by_id: string | null;
  reason: string | null;
  created_at: string;
  changed_by?: HrEmployee | null;
}

export interface Application {
  id: string;
  application_code: string;
  candidate_id: string;
  department_id: string;
  self_description: string;
  status: ApplicationStatus;
  assigned_hr_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  candidate: Candidate;
  department: Department;
  assigned_hr: HrEmployee | null;
  files: CandidateFile[];
  slot_assignment: SlotAssignment | null;
  interview_feedback: InterviewFeedback[];
  hr_notes: HrNote[];
  status_history: StatusHistory[];
}

export interface QueryApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus;
  departmentId?: string;
  hrId?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryCandidatesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApplicationListResponse {
  data: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CandidateListResponse {
  data: (Candidate & { applications: Application[] })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SlotListResponse {
  success: boolean;
  data: InterviewSlot[];
}

export interface QuerySlotsParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  hrId?: string;
  isBooked?: boolean;
}

export interface DashboardStats {
  totalApplications: number;
  newApplications: number;
  interviewsScheduled: number;
  hiredCount: number;
  rejectedCount: number;
  recentApplications: Application[];
}

export interface ApplicationReportItem {
  date: string;
  count: number;
  status: ApplicationStatus;
}

export interface InterviewReportItem {
  date: string;
  totalSlots: number;
  bookedSlots: number;
}

export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type OpportunityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type HiringType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type CareerLevel = 'ENTRY_LEVEL' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'EXECUTIVE';
export type WorkMode = 'ON_SITE' | 'HYBRID' | 'REMOTE';

export interface HiringOpportunity {
  id: string;
  internal_position: string;
  department_id: string;
  number_of_openings: number;
  hiring_priority: OpportunityPriority;
  hiring_type: HiringType;
  hiring_manager_id: string | null;
  reporting_manager_id: string | null;
  internal_notes: string | null;
  
  public_title: string;
  career_level: CareerLevel;
  work_mode: WorkMode;
  location: string;
  min_experience_years: number;
  max_experience_years: number | null;
  educational_qualification: string | null;
  min_salary: number | null;
  max_salary: number | null;
  application_deadline: string | null;
  
  about: string | null;
  responsibilities: string | null;
  benefits: string | null;
  career_growth: string | null;
  
  preferred_languages: string[];
  certifications: string[];
  
  resume_required: boolean;
  employment_proof_required: boolean;
  
  status: OpportunityStatus;
  visibility: string;
  
  created_at: string;
  updated_at: string;
  
  department?: Department;
  hiring_manager?: HrEmployee;
  reporting_manager?: HrEmployee;
  _count?: {
    applications: number;
    interview_slots: number;
  };
}

export interface QueryOpportunitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: OpportunityStatus;
  priority?: OpportunityPriority;
  careerLevel?: CareerLevel;
  hiringType?: HiringType;
  location?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OpportunityListResponse {
  data: HiringOpportunity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------
// ATS Recruiter Workspace Extensions
// ---------------------------------------------------------

export type OfferStatus = 'DRAFT' | 'GENERATED' | 'RELEASED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' | 'JOINED';

export interface Offer {
  id: string;
  application_id: string;
  status: OfferStatus;
  salary: number;
  currency: string;
  joining_date: string | null;
  expiry_date: string | null;
  offer_reference: string;
  generated_by_id: string | null;
  employment_type: string | null;
  location: string | null;
  reporting_manager: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  generated_by?: HrEmployee | null;
  application?: Application;
  department?: Department;
}

export interface QueryOffersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OfferStatus;
  departmentId?: string;
  opportunityId?: string;
  assignedHrId?: string;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  offerDateFrom?: string;
  offerDateTo?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OfferListResponse {
  data: Offer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OfferStats {
  DRAFT: number;
  GENERATED: number;
  RELEASED: number;
  ACCEPTED: number;
  DECLINED: number;
  CANCELLED: number;
  EXPIRED: number;
  JOINED: number;
  joiningToday: number;
  joiningThisWeek: number;
}

export type TimelineEventType = 
  | 'APPLICATION_SUBMITTED' 
  | 'STATUS_CHANGED' 
  | 'INTERVIEW_SCHEDULED' 
  | 'INTERVIEW_COMPLETED' 
  | 'FEEDBACK_ADDED' 
  | 'OFFER_GENERATED' 
  | 'OFFER_RELEASED' 
  | 'OFFER_ACCEPTED' 
  | 'OFFER_DECLINED' 
  | 'DOCUMENT_UPLOADED';

export interface TimelineEvent {
  id: string;
  application_id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  metadata: any | null;
  created_at: string;
  created_by_id: string | null;
  created_by?: HrEmployee | null;
}

export type ActivityEventType = 'VIEW' | 'DOWNLOAD' | 'UPDATE' | 'EMAIL_SENT' | 'NOTE_ADDED';

export interface ActivityEvent {
  id: string;
  application_id: string;
  event_type: ActivityEventType;
  description: string;
  created_at: string;
  hr_id: string | null;
  hr?: HrEmployee | null;
}
