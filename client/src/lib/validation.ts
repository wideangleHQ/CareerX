import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number cannot exceed 15 digits')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number (e.g. +919999999999)');

export const emailSchema = z.string().email('Enter a valid email address');
