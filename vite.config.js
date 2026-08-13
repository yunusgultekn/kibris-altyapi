import { defineConfig } from 'vite';
import { resolve, relative } from 'node:path';
import { buildPages } from './scripts/build-pages.mjs';

const ROOT = __dirname;

// Sayfalar hem dev hem build öncesi üretilir; rollup girdileri buradan gelir.
const generated = buildPages();

const input = Object.fromEntries(
  generated
    .filter((f) => f.endsWith('.html'))
    .map((f) => [relative(ROOT, f).replace(/\/index\.html$/, '').replace('index.html', 'index') || 'index', f])
);

export default defineConfig({
  appType: 'mpa',
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    rollupOptions: { input },
    // three.js kendi parçasında yükleniyor; uyarı sınırını buna göre ayarla
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    {
      // İçerik ya da şablon değişince sayfaları yeniden üret
      name: 'kibris-pages',
      configureServer(server) {
        const watched = [
          resolve(ROOT, 'content/site.json'),
          resolve(ROOT, 'scripts/templates.mjs'),
          resolve(ROOT, 'scripts/build-pages.mjs'),
        ];
        server.watcher.add(watched);
        server.watcher.on('change', async (file) => {
          if (!watched.includes(file)) return;
          const { buildPages: rebuild } = await import(
            `./scripts/build-pages.mjs?t=${Date.now()}`
          );
          rebuild();
          server.ws.send({ type: 'full-reload' });
          server.config.logger.info('  sayfalar yeniden üretildi');
        });
      },
    },
  ],
});
