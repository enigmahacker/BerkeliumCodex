import { defineConfig } from 'vitest/config';
import * as path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/**/__tests__/**/*.test.ts'],
    alias: {
      '@berkelium/events': path.resolve(__dirname, 'packages/events/src/index.ts'),
      '@berkelium/logging': path.resolve(__dirname, 'packages/logging/src/index.ts'),
      '@berkelium/telemetry': path.resolve(__dirname, 'packages/telemetry/src/index.ts'),
      '@berkelium/themes': path.resolve(__dirname, 'packages/themes/src/index.ts'),
      '@berkelium/auth': path.resolve(__dirname, 'packages/auth/src/index.ts'),
      '@berkelium/config': path.resolve(__dirname, 'packages/config/src/index.ts'),
      '@berkelium/permissions': path.resolve(__dirname, 'packages/permissions/src/index.ts'),
      '@berkelium/providers': path.resolve(__dirname, 'packages/providers/src/index.ts'),
      '@berkelium/tools': path.resolve(__dirname, 'packages/tools/src/index.ts'),
      '@berkelium/context': path.resolve(__dirname, 'packages/context/src/index.ts'),
      '@berkelium/plugins': path.resolve(__dirname, 'packages/plugins/src/index.ts'),
      '@berkelium/agent': path.resolve(__dirname, 'packages/agent/src/index.ts'),
      '@berkelium/runtime': path.resolve(__dirname, 'packages/runtime/src/index.ts'),
      '@berkelium/cli': path.resolve(__dirname, 'apps/cli/src/index.ts'),
    },
  },
});
