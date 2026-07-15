import { z } from 'zod';
import { emailSchema, phoneSchema } from '@/src/lib/validation';

export const candidateApplicationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  mobileNumber: phoneSchema,
  whatsappNumber: z.string().optional().or(z.literal('')),
  departmentId: z.string().uuid('Department is required'),
  opportunityId: z.string().uuid('Opportunity is required'),
  experienceYears: z.number({ error: 'Please select your experience' }).min(0).max(50),
  resume: z.any().refine((file) => file !== null && file !== undefined, 'Resume file is required'),
  previousOrgProof: z.any().optional(),
  selfDescription: z.string().min(20, 'Please write at least 20 characters about yourself'),
  slotId: z.string().uuid('Please select an interview slot').optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.experienceYears >= 1) {
      return data.previousOrgProof !== null && data.previousOrgProof !== undefined;
    }
    return true;
  },
  { message: 'Previous organization proof is required for experienced candidates', path: ['previousOrgProof'] }
);

export type CandidateApplicationData = z.infer<typeof candidateApplicationSchema>;
