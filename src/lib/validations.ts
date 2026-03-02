import { z } from 'zod';
import type { LeadStatus } from '@/lib/types';

// ============================================================
// Reusable primitives
// ============================================================

/** Strip leading/trailing whitespace and reject empty strings */
const safeString = (maxLen: number) =>
  z.string().trim().min(1).max(maxLen);

const nicheSchema = safeString(100);
const locationSchema = safeString(150);

/**
 * Business object schema.
 * Only `name` is required -- Outscraper data often has missing fields.
 */
const businessSchema = z.object({
  name: safeString(300),
  placeId: z.string().nullable().default(null),
  address: z.string().default(''),
  phone: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  rating: z.number().default(0),
  reviewCount: z.number().default(0),
  category: z.string().default(''),
  claimed: z.boolean().default(false),
  sponsored: z.boolean().default(false),
});

// ============================================================
// Route schemas
// ============================================================

/** POST /api/search */
export const searchSchema = z.object({
  niche: nicheSchema,
  location: locationSchema,
});

/** POST /api/analyze-stream  &  POST /api/analyze-selected */
export const analyzeSchema = z.object({
  businesses: z.array(businessSchema).min(1),
  niche: nicheSchema,
  location: locationSchema,
});

/** POST /api/analyze-single */
export const analyzeSingleSchema = z.object({
  business: businessSchema,
  niche: nicheSchema,
  location: locationSchema,
});

/** POST /api/analyze-preview */
export const analyzePreviewSchema = z.object({
  businesses: z.array(businessSchema).min(1).max(3),
  niche: nicheSchema,
  location: locationSchema,
});

/** POST /api/visibility */
export const visibilitySchema = z.object({
  businessName: safeString(300),
  niche: nicheSchema,
  location: locationSchema,
});

// ---- Leads ----

const leadStatusEnum = z.enum([
  'new',
  'contacted',
  'pitched',
  'won',
  'lost',
]) satisfies z.ZodType<LeadStatus>;

/** PATCH /api/leads */
export const leadsUpdateSchema = z.object({
  leadId: z.string().uuid(),
  status: leadStatusEnum.optional(),
  notes: z.string().max(5000).optional(),
}).refine(
  (data) => data.status !== undefined || data.notes !== undefined,
  { message: 'At least one of status or notes must be provided' },
);

/** DELETE /api/leads */
export const leadsDeleteSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
});

// ---- Session ----

/** POST /api/session */
export const sessionSaveSchema = z.object({
  niche: nicheSchema,
  location: locationSchema,
  businesses: z.array(z.object({ name: z.string() }).passthrough()).min(1),
});

/** DELETE /api/session  (query-param based, validated manually -- kept for reference) */
export const sessionDeleteSchema = z.object({
  key: z.string().min(3).max(350).optional(),
});

// ---- Stripe checkout ----

export const checkoutSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscription'),
    tier: z.enum(['starter', 'pro', 'enterprise']),
    interval: z.enum(['month', 'year']).optional(),
  }),
  z.object({
    type: z.literal('credits'),
    pack: z.enum(['small', 'medium', 'large', 'xl']),
  }),
]);

// ---- Contact form ----

export const contactSchema = z.object({
  name: safeString(200),
  email: z.string().email().max(200),
  subject: safeString(200),
  message: safeString(5000),
});
