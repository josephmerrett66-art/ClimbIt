import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('github-pages', import.meta.url)),
  publicDir: fileURLToPath(new URL('public', import.meta.url)),
  base: '/ClimbIt/',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('dist-pages', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ...Object.fromEntries(
          ['lighthouse', 'windmill', 'chimney', 'water-tower', 'cable-car'].map(
            (slug) => [
              slug,
              fileURLToPath(
                new URL(`github-pages/${slug}/index.html`, import.meta.url),
              ),
            ],
          ),
        ),
        main: fileURLToPath(
          new URL('github-pages/index.html', import.meta.url),
        ),
        church: fileURLToPath(
          new URL('github-pages/church/index.html', import.meta.url),
        ),
        tower: fileURLToPath(
          new URL('github-pages/tower/index.html', import.meta.url),
        ),
      },
    },
  },
});
