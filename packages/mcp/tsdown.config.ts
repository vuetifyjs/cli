import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: './src/cli/index.ts',
  format: 'esm',
  clean: true,
  platform: 'node',
  banner: `#!/usr/bin/env node`,
})
