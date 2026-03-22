import { defineConfig } from 'tsdown/config'

const RE_CYAN = /t\.cyan/g

export default defineConfig({
  entry: './src/index.ts',
  banner: `#!/usr/bin/env node`,
  exports: true,
  deps: {
    onlyBundle: false,
  },
  plugins: [
    {
      name: 'replace-cyan-with-blue',
      transform (code, id) {
        if (id.includes('@clack/prompts/')) {
          return code.replace(RE_CYAN, 't.blue')
        }
        return code
      },
    },
  ],
})
