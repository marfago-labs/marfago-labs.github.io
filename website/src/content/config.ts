import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    series: z.string().optional(),
    order: z.number(),
    date: z.coerce.date(),
    description: z.string(),
  }),
});

export const collections = { blog };
