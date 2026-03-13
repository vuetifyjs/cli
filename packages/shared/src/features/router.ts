import type { Feature } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { builders, loadFile } from 'magicast'
import { join } from 'pathe'
import { installFeature } from '../utils/installFeature'
import { addStatementToFunctionBody, isFunction } from '../utils/magicast'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const router: Feature = {
  name: 'router',
  apply: async ({ cwd, pkg, isTypescript, type }) => {
    await installFeature('router', cwd, type)

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
    if (isFunction(registerPlugins)) {
      addStatementToFunctionBody(registerPlugins, 'app.use(router)')
    }

    await writeFile(pluginsPath, mod.generate().code)

    // Update tsconfig.app.json
    if (isTypescript) {
      const tsConfigPath = join(cwd, 'tsconfig.app.json')
      if (existsSync(tsConfigPath)) {
        const tsConfig = await loadFile(tsConfigPath)
        tsConfig.exports.vueCompilerOptions = tsConfig.exports.vueCompilerOptions || {}
        tsConfig.exports.vueCompilerOptions.plugins = tsConfig.exports.vueCompilerOptions.plugins || []
        // Standard router doesn't strictly need these for unplugin features, but it helps if user adds route blocks later
        tsConfig.exports.vueCompilerOptions.plugins.push('vue-router/volar/sfc-typed-router', 'vue-router/volar/sfc-route-blocks')
        await writeFile(tsConfigPath, tsConfig.generate().code)
      }
    }
  },
}

export const fileRouter: Feature = {
  name: 'file-router',
  apply: async ({ cwd, pkg, isTypescript, type }) => {
    await installFeature('file-router', cwd, type)

    const ext = isTypescript ? 'ts' : 'js'
    pkg.dependencies = pkg.dependencies || {}
    pkg.dependencies['vue-router'] = rootPkg.dependencies['vue-router']

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
    if (isFunction(registerPlugins)) {
      addStatementToFunctionBody(registerPlugins, 'app.use(router)')
    }

    await writeFile(pluginsPath, mod.generate().code)

    // Update vite.config.mjs / .mts
    const viteConfigPath = join(cwd, `vite.config.m${ext}`)
    if (existsSync(viteConfigPath)) {
      const viteMod = await loadFile(viteConfigPath)

      viteMod.imports.$prepend({
        from: 'vue-router/vite',
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
        plugins.unshift(builders.raw('VueRouter({ dts: \'src/typed-router.d.ts\' })'))
      }

      await writeFile(viteConfigPath, viteMod.generate().code)
    }

    // Update tsconfig.app.json
    if (isTypescript) {
      const tsConfigPath = join(cwd, 'tsconfig.app.json')
      if (existsSync(tsConfigPath)) {
        const tsConfig = await loadFile(tsConfigPath)
        tsConfig.exports.vueCompilerOptions = tsConfig.exports.vueCompilerOptions || {}
        tsConfig.exports.vueCompilerOptions.plugins = tsConfig.exports.vueCompilerOptions.plugins || []
        tsConfig.exports.vueCompilerOptions.plugins.push('vue-router/volar/sfc-typed-router', 'vue-router/volar/sfc-route-blocks')
        await writeFile(tsConfigPath, tsConfig.generate().code)
      }
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
  history: createWebHistory(import.meta.env.BASE_URL),
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
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
`
}
