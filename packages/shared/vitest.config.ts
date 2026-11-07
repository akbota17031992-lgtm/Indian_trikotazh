import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cacheDir: './node_modules/.vitest',
  },
});
