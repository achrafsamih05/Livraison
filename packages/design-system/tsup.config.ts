import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tokens/index': 'src/tokens/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  async onSuccess() {
    const source = resolve(here, 'src/styles.css');
    const destination = resolve(here, 'dist/styles.css');
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  },
});
