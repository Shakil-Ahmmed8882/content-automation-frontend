import { z } from "zod";

// The shared TextField converts `type="number"` input to a number (undefined when
// cleared), so the schema validates a real integer, not text.
const sortOrder = z
  .number({ error: "Order must be a whole number" })
  .int("Order must be a whole number");

export const platformCreateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Key must be a lowercase slug (letters, numbers, hyphens)",
    ),
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(["LIVE", "COMING_SOON"]),
  sortOrder,
  isActive: z.boolean(),
});

export const platformEditSchema = platformCreateSchema.omit({ key: true });

export const featureSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a lowercase slug (letters, numbers, hyphens)",
    ),
  title: z.string().trim().min(1, "Title is required"),
  shortDescription: z.string().trim().min(1, "Short description is required"),
  description: z.string().trim().min(1, "Description is required"),
  status: z.enum(["COMING_SOON", "IN_DEVELOPMENT", "PLANNED"]),
  sortOrder,
  isPremiumVisible: z.boolean(),
});

export type PlatformCreateValues = z.infer<typeof platformCreateSchema>;
export type PlatformEditValues = z.infer<typeof platformEditSchema>;
export type FeatureValues = z.infer<typeof featureSchema>;
