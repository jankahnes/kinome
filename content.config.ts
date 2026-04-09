import { defineCollection, defineContentConfig, z } from '@nuxt/content';

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'page',
      source: 'articles/**',
      schema: z.object({
        title: z.string(),
        excerpt: z.string(),
        category: z.string(),
        emoji: z.string(),
        gradient: z.string(),
        readTime: z.string(),
        date: z.string(),
        author: z.string().default('Kinome'),
        cover: z.string().optional(),
      }),
    }),
  },
});
