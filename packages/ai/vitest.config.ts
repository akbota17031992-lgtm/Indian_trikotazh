import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '../shared/node_modules/vitest/dist/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    cacheDir: './node_modules/.vitest',
  },
  resolve: {
    alias: {
      zod: path.resolve(__dirname, '../shared/node_modules/zod/index.js'),
      '@india-trikotaj/shared': path.resolve(__dirname, '../shared/dist/index.js'),
    },
  },
});
