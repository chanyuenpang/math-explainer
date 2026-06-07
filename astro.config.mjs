// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

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
  },

  adapter: cloudflare()
});