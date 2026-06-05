import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

const partySchema = z.object({
  name: z.string().min(1, 'Required').max(160),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, '7-15 digits, optional leading +'),
  line1: z.string().min(1, 'Required').max(255),
  city: z.string().min(1, 'Required').max(120),
  country: z.string().length(2, '2-letter ISO code'),
});

export const createShipmentSchema = z.object({
  sender: partySchema,
  recipient: partySchema,
  service: z.enum(['SAME_DAY', 'NEXT_DAY', 'EXPRESS', 'STANDARD', 'ECONOMY']),
  weightGrams: z.coerce.number().int().min(1, 'Weight is required.').max(2_000_000),
  codAmount: z.coerce.number().min(0).optional(),
  declaredValue: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).default('SAR'),
  reference: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const profileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, '7-15 digits, optional leading +')
    .optional()
    .or(z.literal('')),
});
export type ProfileInput = z.infer<typeof profileSchema>;
