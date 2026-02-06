import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: './src/index.ts',
  banner: `#!/usr/bin/env node`,
  exports: true,
  inlineOnly: false,
})
