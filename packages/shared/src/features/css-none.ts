import type { Feature } from './types'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

export const cssNone: Feature = {
  name: 'css-none',
  apply: async ({ cwd }) => {
    const isNuxt = existsSync(join(cwd, 'nuxt.config.ts'))

    // Cleanup from tailwindcss.ts
    const unocssConfig = join(cwd, 'unocss.config.ts')
    if (existsSync(unocssConfig)) {
      rmSync(unocssConfig)
    }

    // Cleanup from unocss.ts
    const tailwindCss = isNuxt ? join(cwd, 'app/assets/css/tailwind.css') : join(cwd, 'src/tailwind.css')
    if (existsSync(tailwindCss)) {
      rmSync(tailwindCss)
    }
  },
}
