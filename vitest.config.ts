import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
    // Backend lib tests are included: talentVisibility.ts is the single
    // choke point for learner data reaching employers, and it is pure, so it
    // is worth testing directly rather than only through routes.
    include: [
      'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'backend/src/**/__tests__/**/*.{test,spec}.ts',
    ],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**', 'src/components/**', 'backend/src/lib/talentVisibility.ts'],
      exclude: ['**/__tests__/**', '**/*.d.ts'],
    },
  },
});
