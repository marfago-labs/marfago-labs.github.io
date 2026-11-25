import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
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
