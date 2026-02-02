import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/__tests__/**/*.test.ts',
      'src/detector/__tests__/**/*.test.ts',
      'src/reporter/__tests__/**/*.test.ts',
      'src/utils/__tests__/**/*.test.ts',
    ],
  },
});
