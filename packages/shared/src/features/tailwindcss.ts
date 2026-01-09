import type { Feature } from './types'
import { existsSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadFile } from 'magicast'
import { addNuxtModule, addVitePlugin } from 'magicast/helpers'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const tailwindcss: Feature = {
  name: 'tailwindcss',
  apply: async ({ cwd, pkg, isTypescript }) => {
    const isNuxt = existsSync(join(cwd, 'nuxt.config.ts'))

    const unocssConfig = join(cwd, 'unocss.config.ts')

    if (existsSync(unocssConfig)) {
      rmSync(unocssConfig)
    }

    if (isNuxt) {
      pkg.devDependencies = pkg.devDependencies || {}
      pkg.devDependencies['tailwindcss'] = rootPkg.dependencies['tailwindcss']
      pkg.devDependencies['@nuxtjs/tailwindcss'] = rootPkg.dependencies['@nuxtjs/tailwindcss']

      const configPath = join(cwd, 'nuxt.config.ts')
      const mod = await loadFile(configPath)
      addNuxtModule(mod, '@nuxtjs/tailwindcss')

      await writeFile(configPath, mod.generate().code)
    } else {
      pkg.devDependencies = pkg.devDependencies || {}
      pkg.devDependencies['tailwindcss'] = rootPkg.dependencies['tailwindcss']
      pkg.devDependencies['@tailwindcss/vite'] = rootPkg.dependencies['@tailwindcss/vite']

      const ext = isTypescript ? 'ts' : 'js'
      const viteConfigPath = join(cwd, `vite.config.m${ext}`)
      const mod = await loadFile(viteConfigPath)

      addVitePlugin(mod, {
        from: '@tailwindcss/vite',
        constructor: 'tailwindcss',
      })

      await writeFile(viteConfigPath, mod.generate().code)

      // Import in main.ts
      const mainFiles = ['src/main.ts', 'src/main.js']
      for (const file of mainFiles) {
        const filePath = join(cwd, file)
        if (existsSync(filePath)) {
          const mainFile = await readFile(filePath, 'utf8')
          // find // Styles and add import './main.css'; after it
          await writeFile(filePath, mainFile.replace(/\/\/ Styles/g, '// Styles\nimport \'./tailwind.css\';'))
          break
        }
      }
    }
  },
}
