import { z } from "zod";

export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const POST_IMAGE_MAX_KB = POST_IMAGE_MAX_BYTES / 1024;

const platformKeySchema = z.string().trim().min(1);

export const postImageSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Choose an image",
  )
  .refine((file) => file.type.startsWith("image/"), {
    message: "Only image files are allowed",
  })
  .refine((file) => file.size <= POST_IMAGE_MAX_BYTES, {
    message: "Image must be 5 MB or smaller",
  });

export const createPostSchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().trim().min(1, "Content is required"),
  image: postImageSchema.optional(),
  platformKeys: z.array(platformKeySchema).default([]),
});

export const publishTargetSchema = z.object({
  platformKeys: z
    .array(platformKeySchema)
    .min(1, "Select at least one platform to publish to"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
