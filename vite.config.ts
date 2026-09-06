import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  define: { __SITE_BASE_PATH__: JSON.stringify(process.env.BASE_PATH || '') },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext()],
  server: { host: '127.0.0.1' },
});
