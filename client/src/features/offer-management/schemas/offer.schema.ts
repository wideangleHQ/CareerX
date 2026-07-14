import { z } from 'zod';

export const GenerateOfferSchema = z.object({
  applicationId: z.string().min(1, 'Application is required'),
  salary: z.coerce.number().min(1, 'Salary must be greater than 0'),
  currency: z.string().min(1, 'Currency is required').default('INR'),
  joiningDate: z.string().optional(),
  expiryDate: z.string().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  reportingManager: z.string().optional(),
  remarks: z.string().optional(),
});

export type GenerateOfferData = z.infer<typeof GenerateOfferSchema>;

export const ExtendOfferSchema = z.object({
  expiryDate: z.string().min(1, 'New expiry date is required'),
  joiningDate: z.string().optional(),
});

export type ExtendOfferData = z.infer<typeof ExtendOfferSchema>;
