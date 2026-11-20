// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static build: pages are generated from Supabase at build time.
// Cloudflare Pages rebuilds on every push, and once a day via the
// GitHub Action in .github/workflows/daily-rebuild.yml.
export default defineConfig({
  site: 'https://silverscreenjkt.com',
  output: 'static',
  integrations: [react()],
  trailingSlash: 'ignore',
});
