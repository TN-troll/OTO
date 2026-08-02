import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@car-ads/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: ['fast-check'],
      },
    },
  },
});
