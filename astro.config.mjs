import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';
import tailwindcss from '@tailwindcss/vite';

const isVercelBuild = process.env.VERCEL === '1' || process.env.ASTRO_ADAPTER === 'vercel';

export default defineConfig({
  output: 'server',
  adapter: isVercelBuild ? vercel() : node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
