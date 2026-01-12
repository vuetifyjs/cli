import type { Feature } from './types'
import { existsSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadFile } from 'magicast'
import { addNuxtModule, addVitePlugin } from 'magicast/helpers'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const unocss: Feature = {
  name: 'unocss',
  apply: async ({ cwd, pkg, isTypescript, isNuxt }) => {
    // Add UnoCSS dependencies
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['unocss'] = rootPkg.dependencies['unocss']

    const tailwindCss = isNuxt ? join(cwd, 'app/assets/css/tailwind.css') : join(cwd, 'src/tailwind.css')

    if (existsSync(tailwindCss)) {
      rmSync(tailwindCss)
    }

    // Remove Tailwind dependencies
    if (pkg.devDependencies) {
      delete pkg.devDependencies['tailwindcss']
      delete pkg.devDependencies['@tailwindcss/vite']
      delete pkg.devDependencies['@nuxtjs/tailwindcss']
    }

    if (isNuxt) {
      pkg.devDependencies['@unocss/nuxt'] = rootPkg.dependencies['@unocss/nuxt']

      const configPath = join(cwd, 'nuxt.config.ts')
      const mod = await loadFile(configPath)
      addNuxtModule(mod, '@unocss/nuxt')

      await writeFile(configPath, mod.generate().code)
    } else {
      const ext = isTypescript ? 'ts' : 'js'
      const viteConfigPath = join(cwd, `vite.config.m${ext}`)
      const mod = await loadFile(viteConfigPath)

      addVitePlugin(mod, {
        from: 'unocss/vite',
        constructor: 'UnoCSS',
      })

      await writeFile(viteConfigPath, mod.generate().code)

      // Add import to main.ts
      // Try src/main.ts or src/index.ts
      const mainFiles = ['src/main.ts', 'src/main.js']
      for (const file of mainFiles) {
        const filePath = join(cwd, file)
        if (existsSync(filePath)) {
          const content = await readFile(filePath, 'utf8')
          await writeFile(filePath, content.replace(/\/\/ Styles/g, '// Styles\nimport \'virtual:uno.css\''))
          break
        }
      }
    }
  },
}
