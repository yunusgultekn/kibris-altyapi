import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    // three.js kendi parçasında yükleniyor; uyarı sınırını buna göre ayarla
    chunkSizeWarningLimit: 700,
  },
});
