import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      series: z.string().optional(),
      order: z.number(),
      date: z.coerce.date(),
      lastUpdated: z.coerce.date().optional(),
      version: z
        .string()
        .regex(/^\d+\.\d+$/)
        .optional(),
      description: z.string(),
      cover: z.string().optional(),
      coverAlt: z.string().optional(),
    })
    .transform((data) => ({
      ...data,
      lastUpdated: data.lastUpdated ?? data.date,
      version: data.version ?? "1.0",
    })),
});

export const collections = { blog };
