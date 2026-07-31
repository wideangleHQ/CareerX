import { z } from 'zod';

// <input type="number"> yields '' when cleared and undefined when never
// mounted. Passing either straight into z.coerce.number() is unsafe:
// Number('') is 0 (silently wrong data) and Number(undefined) is NaN, which
// fails with the opaque "expected number, received NaN".
const blankToUndefined = (value: unknown) =>
  value === '' || value === null ? undefined : value;

const optionalNumber = z.preprocess(blankToUndefined, z.coerce.number().nullish());

export const OpportunityInternalSchema = z.object({
  internal_position: z.string().min(2, 'Internal position is required'),
  department_id: z.string().min(1, 'Department is required'),
  hiring_priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  hiring_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
  career_level: z.enum(['ENTRY_LEVEL', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE']),
  hiring_manager_id: z.string().nullish(),
  reporting_manager_id: z.string().nullish(),
  number_of_openings: z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: 'Number of openings is required' }).min(1, 'Must have at least 1 opening'),
  ),
  internal_notes: z.string().nullish(),
});

export const OpportunityPublicSchema = z.object({
  public_title: z.string().min(2, 'Public title is required'),
  about: z.string().min(10, 'About section is required'),
  responsibilities: z.string().min(10, 'Responsibilities are required'),
  min_experience_years: z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: 'Minimum experience is required' }).min(0, 'Cannot be negative'),
  ),
  max_experience_years: optionalNumber,
  educational_qualification: z.string().nullish(),
  work_mode: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']),
  location: z.string().min(2, 'Location is required'),
  min_salary: optionalNumber,
  max_salary: optionalNumber,
  benefits: z.string().nullish(),
  career_growth: z.string().nullish(),
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
