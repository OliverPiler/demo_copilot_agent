/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        // These files only define types or perform process startup and seeding.
        'src/models/**',
        'src/index.ts',
        'src/init-db.ts',
        'src/db/seed.ts',
        'src/seedData.ts',
      ],
      thresholds: {
        lines: 80,
      },
      // Include json-summary so CI can read api/coverage/coverage-summary.json
      reporter: ['text', 'json', 'json-summary', 'html'],
    },
    exclude: ['dist/**', 'node_modules/**', 'database/**']
  },
});
