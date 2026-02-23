import type { Feature } from './types'
import { existsSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { loadFile } from 'magicast'
import { addNuxtModule, addVitePlugin } from 'magicast/helpers'
import { join } from 'pathe'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const tailwindcss: Feature = {
  name: 'tailwindcss',
  apply: async ({ cwd, pkg, isTypescript, isNuxt, type }) => {
    if (type === 'vuetify' && !isNuxt) {
      return
    }

    const unocssConfigs = [
      join(cwd, 'unocss.config.ts'),
      join(cwd, 'uno.config.ts'),
    ]
    for (const configPath of unocssConfigs) {
      if (existsSync(configPath)) {
        rmSync(configPath)
      }
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

      const mainFiles = ['src/main.ts', 'src/main.js']
      for (const file of mainFiles) {
        const filePath = join(cwd, file)
        if (existsSync(filePath)) {
          const mainFile = await readFile(filePath, 'utf8')
          await writeFile(filePath, mainFile.replace(/\/\/ Styles/g, '// Styles\nimport \'./tailwind.css\';'))
          break
        }
      }
    }
  },
}
