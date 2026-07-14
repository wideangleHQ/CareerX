import { z } from 'zod';
import { emailSchema, phoneSchema } from '@/src/lib/validation';

export const candidateApplicationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  mobileNumber: phoneSchema,
  whatsappNumber: z.string().optional().or(z.literal('')),
  departmentId: z.string().uuid('Please select a department'),
  selfDescription: z.string().min(20, 'Please write at least 20 characters about yourself'),
  slotId: z.string().uuid('Please select an interview slot'),
  resume: z.any().refine((file) => file !== null && file !== undefined, 'Resume file is required'),
});

export type CandidateApplicationData = z.infer<typeof candidateApplicationSchema>;
