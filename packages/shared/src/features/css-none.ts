import type { Feature } from './types'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'pathe'

export const cssNone: Feature = {
  name: 'css-none',
  apply: async ({ cwd, isNuxt }) => {
    // Cleanup from tailwindcss.ts
    const unocssConfigs = [
      join(cwd, 'unocss.config.ts'),
      join(cwd, 'uno.config.ts'),
    ]
    for (const configPath of unocssConfigs) {
      if (existsSync(configPath)) {
        rmSync(configPath)
      }
    }

    // Cleanup from unocss.ts
    const tailwindCss = isNuxt ? join(cwd, 'app/assets/css/tailwind.css') : join(cwd, 'src/tailwind.css')
    if (existsSync(tailwindCss)) {
      rmSync(tailwindCss)
    }
  },
}
