import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// base './' = どの階層のホスティング（GitHub Pages のサブパス等）でも動く
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
  test: { include: ['src/**/*.test.ts'] },
});
