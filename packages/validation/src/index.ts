import { z } from 'zod';

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  termsVersion: z.string().min(1, 'Terms version is required'),
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const onboardingProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(150, 'Bio cannot exceed 150 characters').optional(),
  location: z.string().max(100).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  skip: z.boolean().default(false),
});

export const createPostSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(2000, 'Post cannot exceed 2000 characters'),
  mediaUrls: z.array(z.string().url()).max(10).default([]),
});

export const presignedUrlSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  fileSize: z.number().positive().max(100 * 1024 * 1024, 'File size exceeds maximum limit of 100MB').optional(),
});

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_BUCKET_NAME: z.string().default('social-media-assets'),
  STORAGE_PUBLIC_URL: z.string().url().optional(),
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;
export const loginFormSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const clientSignUpSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy',
    }),
    termsVersion: z.string().default('1.0'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const clientProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only')
    .optional(),
  bio: z.string().max(150, 'Bio cannot exceed 150 characters').optional().default(''),
  location: z.string().max(100).optional().default(''),
  website: z
    .string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal(''))
    .default(''),
  avatarUrl: z.string().optional().default(''),
  skip: z.boolean().default(false),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type ClientSignUpInput = z.infer<typeof clientSignUpSchema>;
export type ClientProfileInput = z.infer<typeof clientProfileSchema>;
export type EnvConfig = z.infer<typeof envSchema>;
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;

export const userPostsQuerySchema = z.object({
  sort: z.enum(['latest', 'popular', 'old']).default('latest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(18),
});

export const createVerificationSchema = z.object({
  category: z.enum(['CREATOR', 'BUSINESS', 'PUBLIC_FIGURE', 'ORGANIZATION']),
  legalName: z.string().min(2, 'Legal name must be at least 2 characters').max(100),
  documentType: z.string().min(2, 'Document type is required').max(50),
  documentUrl: z.string().url('Invalid document URL'),
  additionalInfo: z.string().max(500).optional(),
});

export const reviewVerificationSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type UserPostsQueryInput = z.infer<typeof userPostsQuerySchema>;
export type CreateVerificationInput = z.infer<typeof createVerificationSchema>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;

