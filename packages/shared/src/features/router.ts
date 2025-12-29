import type { Feature } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { builders, loadFile } from 'magicast'
import { installFeature } from '../utils/installFeature'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const router: Feature = {
  name: 'router',
  apply: async ({ cwd, pkg, isTypescript }) => {
    await installFeature('router', cwd)

    const ext = isTypescript ? 'ts' : 'js'
    pkg.dependencies = pkg.dependencies || {}
    pkg.dependencies['vue-router'] = rootPkg.dependencies['vue-router']

    // Create router file
    const routerContent = getRouterContent(isTypescript)
    if (!existsSync(join(cwd, 'src/router'))) {
      mkdirSync(join(cwd, 'src/router'), { recursive: true })
    }
    await writeFile(join(cwd, `src/router/index.${ext}`), routerContent)

    // Update plugins/index.ts
    const pluginsPath = join(cwd, `src/plugins/index.${ext}`)
    const mod = await loadFile(pluginsPath)

    mod.imports.$prepend({
      from: '../router',
      imported: 'default',
      local: 'router',
    })

    const registerPlugins = mod.exports.registerPlugins
    if (registerPlugins && registerPlugins.$type === 'function') {
      registerPlugins.$body.push('app.use(router)')
    }

    await writeFile(pluginsPath, mod.generate().code)
  },
}

export const fileRouter: Feature = {
  name: 'file-router',
  apply: async ({ cwd, pkg, isTypescript }) => {
    await installFeature('file-router', cwd)

    const ext = isTypescript ? 'ts' : 'js'
    pkg.dependencies = pkg.dependencies || {}
    pkg.dependencies['vue-router'] = rootPkg.dependencies['vue-router']
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['unplugin-vue-router'] = rootPkg.dependencies['unplugin-vue-router']

    // Create router file
    const routerContent = getFileRouterContent(isTypescript)
    if (!existsSync(join(cwd, 'src/router'))) {
      mkdirSync(join(cwd, 'src/router'), { recursive: true })
    }
    await writeFile(join(cwd, `src/router/index.${ext}`), routerContent)

    // Update plugins/index.ts
    const pluginsPath = join(cwd, `src/plugins/index.${ext}`)
    const mod = await loadFile(pluginsPath)

    mod.imports.$prepend({
      from: '../router',
      imported: 'default',
      local: 'router',
    })

    const registerPlugins = mod.exports.registerPlugins
    if (registerPlugins && registerPlugins.$type === 'function') {
      registerPlugins.$body.push('app.use(router)')
    }

    await writeFile(pluginsPath, mod.generate().code)

    // Update vite.config.mjs / .mts
    const viteConfigPath = join(cwd, `vite.config.m${ext}`)
    if (existsSync(viteConfigPath)) {
      const viteMod = await loadFile(viteConfigPath)

      viteMod.imports.$prepend({
        from: 'unplugin-vue-router/vite',
        imported: 'default',
        local: 'VueRouter',
      })

      // Inject VueRouter() before Vue()
      // This is a bit tricky with magicast if we don't know the structure perfectly.
      // Usually plugins is an array.
      const plugins = viteMod.exports.default.plugins || viteMod.exports.default.$args?.[0]?.plugins
      if (plugins && Array.isArray(plugins)) {
        // We need to insert before 'vue()' or 'Vue()'
        // For simplicity, let's unshift it.
        // Note: unplugin-vue-router MUST be before vue()
        plugins.unshift(builders.raw('VueRouter()'))
      }

      await writeFile(viteConfigPath, viteMod.generate().code)
    }
  },
}

function getRouterContent (ts: boolean) {
  return `/**
 * router/index.${ts ? 'ts' : 'js'}
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Index,
    },
  ],
})

export default router
`
}

function getFileRouterContent (ts: boolean) {
  return `/**
 * router/index.${ts ? 'ts' : 'js'}
 *
 * Automatic routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
})

export default router
`
}
