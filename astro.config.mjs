// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  base: '/math-explainer',
  trailingSlash: 'always',
  vite: {
    preview: {
      allowedHosts: true
    }
  }
});
