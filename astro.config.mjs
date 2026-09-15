// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import markdownIntegration from '@astropub/md'

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    markdownIntegration(),
  ],
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
    // syntaxHighlight: 'shiki'
    // syntaxHighlight: 'prism'
  }
});