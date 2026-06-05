import { z } from 'zod';

const ROLE_VALUES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'MANAGER',
  'OPERATOR',
  'DRIVER',
  'FINANCE',
  'SUPPORT',
  'MERCHANT',
  'CUSTOMER',
] as const;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'At least 12 characters.')
    .regex(/[A-Z]/, 'Add an uppercase letter.')
    .regex(/[a-z]/, 'Add a lowercase letter.')
    .regex(/[0-9]/, 'Add a digit.'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, '7-15 digits.')
    .optional()
    .or(z.literal('')),
  roles: z.array(z.enum(ROLE_VALUES)).default([]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, '7-15 digits.')
    .optional()
    .or(z.literal('')),
  roles: z.array(z.enum(ROLE_VALUES)),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userStatusSchema = z.object({
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
});

export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase alphanumeric with single hyphens.'),
  name: z.string().min(2).max(200),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
});
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
