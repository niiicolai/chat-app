import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: [
      './vitest.setup.js',
    ],
    globalSetup: [
      './vitest.global.js',
    ],
  },
});