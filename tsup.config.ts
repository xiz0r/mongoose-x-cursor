import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cache.ts'],
  target: 'es2020',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
