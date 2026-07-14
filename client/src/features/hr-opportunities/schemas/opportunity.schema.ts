import { z } from 'zod';

export const OpportunityInternalSchema = z.object({
  internal_position: z.string().min(2, 'Internal position is required'),
  department_id: z.string().min(1, 'Department is required'),
  hiring_priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  hiring_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  career_level: z.enum(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE']),
  hiring_manager_id: z.string().optional(),
  reporting_manager_id: z.string().optional(),
  number_of_openings: z.coerce.number().min(1, 'Must have at least 1 opening'),
  internal_notes: z.string().optional(),
});

export const OpportunityPublicSchema = z.object({
  public_title: z.string().min(2, 'Public title is required'),
  about: z.string().min(10, 'About section is required'),
  responsibilities: z.string().min(10, 'Responsibilities are required'),
  min_experience_years: z.coerce.number().min(0),
  max_experience_years: z.coerce.number().nullable().optional(),
  educational_qualification: z.string().optional(),
  work_mode: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']),
  location: z.string().min(2, 'Location is required'),
  min_salary: z.coerce.number().nullable().optional(),
  max_salary: z.coerce.number().nullable().optional(),
  benefits: z.string().optional(),
  career_growth: z.string().optional(),
});

export const OpportunityDocumentsSchema = z.object({
  resume_required: z.boolean(),
  employment_proof_required: z.boolean(),
});

export const OpportunityWizardSchema = z.object({
  ...OpportunityInternalSchema.shape,
  ...OpportunityPublicSchema.shape,
  ...OpportunityDocumentsSchema.shape,
  application_deadline: z.string().nullable().optional(),
  preferred_languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

export type OpportunityWizardData = z.infer<typeof OpportunityWizardSchema>;
