// scripts/check-v3.ts を vitest で動かすための設定: npx vitest run --config scripts/check-v3.config.ts
import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({ plugins: [preact()], test: { include: ['scripts/check-v3.ts'], testTimeout: 120000 } });
