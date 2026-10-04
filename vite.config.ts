import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Writes precache.json: every built JS/CSS file and icon, for the service worker (public/sw.js) to
 * cache on install so the app works offline. The official PDFs are left out (about 35 MB); the
 * service worker caches each one the first time its form is opened.
 */
const precache = (): Plugin => ({
  name: 'camino-precache',
  apply: 'build',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter((f) => /\.(js|css)$/.test(f));
    const statics = ['manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify([...files, ...statics].sort()) });
  },
});

export default defineConfig({
  plugins: [react(), precache()],
});
