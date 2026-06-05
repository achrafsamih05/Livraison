import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const podSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required.').max(160),
  notes: z.string().max(1000).optional().or(z.literal('')),
  signatureDataUrl: z.string().startsWith('data:image/').optional(),
  photoDataUrl: z.string().startsWith('data:image/').optional(),
});
export type PodInput = z.infer<typeof podSchema>;

export const failureSchema = z.object({
  reason: z.string().min(1, 'A reason is required.').max(500),
});
export type FailureInput = z.infer<typeof failureSchema>;
