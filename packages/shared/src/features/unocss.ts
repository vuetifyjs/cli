import type { Feature, FeatureContext } from './types'
import { existsSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { loadFile } from 'magicast'
import { addNuxtModule, addVitePlugin } from 'magicast/helpers'
import { join } from 'pathe'
import rootPkg from './dependencies/package.json' with { type: 'json' }

async function applyUnocssBase (
  { cwd, pkg, isTypescript, isNuxt }: FeatureContext,
  options: { presetVuetify?: boolean } = {},
) {
  pkg.devDependencies = pkg.devDependencies || {}
  pkg.devDependencies['unocss'] = rootPkg.dependencies['unocss']
  pkg.devDependencies['@unocss/transformer-directives'] = rootPkg.dependencies['@unocss/transformer-directives']
  if (options.presetVuetify) {
    pkg.devDependencies['unocss-preset-vuetify'] = rootPkg.dependencies['unocss-preset-vuetify']
  }

  const tailwindCss = isNuxt ? join(cwd, 'app/assets/css/tailwind.css') : join(cwd, 'src/tailwind.css')

  if (existsSync(tailwindCss)) {
    rmSync(tailwindCss)
  }

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
    return
  }

  const ext = isTypescript ? 'ts' : 'js'
  const viteConfigPath = join(cwd, `vite.config.m${ext}`)
  const mod = await loadFile(viteConfigPath)

  addVitePlugin(mod, {
    from: 'unocss/vite',
    constructor: 'UnoCSS',
  })

  await writeFile(viteConfigPath, mod.generate().code)

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

export const unocss: Feature = {
  name: 'unocss',
  apply: async ctx => {
    await applyUnocssBase(ctx)
  },
}

export const unocssWind4: Feature = {
  name: 'unocss-wind4',
  apply: async ctx => {
    await applyUnocssBase(ctx)
  },
}

export const unocssVuetify: Feature = {
  name: 'unocss-vuetify',
  apply: async ctx => {
    await applyUnocssBase(ctx, { presetVuetify: true })
  },
}
