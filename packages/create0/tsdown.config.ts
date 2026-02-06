import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: './src/index.ts',
  banner: `#!/usr/bin/env node`,
  exports: true,
  inlineOnly: false,
  plugins: [
    {
      name: 'replace-cyan-with-blue',
      transform (code, id) {
        if (id.includes('@clack/prompts/')) {
          return code.replace(/t.cyan/g, 't.blue')
        }
        return code
      },
    },
  ],
})
