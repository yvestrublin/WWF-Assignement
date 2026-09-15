import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import {
  pageSchema,
  scrollerSchema,
} from './lib/content-schema';

const pages = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml,json}',
    base: './src/content/pages',
  }),
  schema: pageSchema,
});

const scrollers = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml,json}',
    base: './src/content/scrollers',
  }),
  schema: scrollerSchema,
});

export const collections = {
  pages,
  scrollers,
};