import fs from 'node:fs'
import path from 'node:path'
import { x } from 'tinyexec'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const CLI_PATH = path.resolve(__dirname, '../dist/index.mjs')
// Assuming templates are at the root of the repo
const TEMPLATES_PATH = path.resolve(__dirname, '../../../templates')
const TEMP_DIR = path.resolve(__dirname, '../.test-tmp')

const TIMEOUT = 10_000 // 10s

describe('create-vuetify matrix', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR)
    }
  })

  afterAll(() => {
    // fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  })

  const runCli = async (args: string[], cwd: string) => {
    try {
      const proc = x('node', [CLI_PATH, ...args], {
        nodeOptions: {
          cwd,
          env: {
            ...process.env,
            VUETIFY_CLI_TEMPLATES_PATH: TEMPLATES_PATH,
          },
        },
        throwOnError: true,
      })

      for await (const line of proc) {
        console.log(line)
      }

      return await proc
    } catch (error: any) {
      console.error('Command failed:', error.message)
      console.error('STDOUT:', error.stdout)
      console.error('STDERR:', error.stderr)
      throw error
    }
  }

  const matrix = [
    // Vue + JS
    { name: 'vue-js', args: ['--type=vue', '--no-typescript', '--features='] },
    // Vue + TS
    { name: 'vue-ts', args: ['--type=vue', '--typescript', '--features='] },
    // Vue + TS + Router
    { name: 'vue-ts-router', args: ['--type=vue', '--typescript', '--features=router'] },
    // Vue + TS + Pinia
    { name: 'vue-ts-pinia', args: ['--type=vue', '--typescript', '--features=pinia'] },
    // Vue + TS + ESLint
    { name: 'vue-ts-eslint', args: ['--type=vue', '--typescript', '--features=eslint'] },
    // Vue + TS + All
    { name: 'vue-ts-all', args: ['--type=vue', '--typescript', '--features=router,pinia,eslint'] },

    // Nuxt
    { name: 'nuxt', args: ['--type=nuxt', '--features='] },
    // Nuxt + Pinia
    { name: 'nuxt-pinia', args: ['--type=nuxt', '--features=pinia'] },
    // Nuxt + Vuetify Module
    { name: 'nuxt-module', args: ['--type=nuxt', '--features=vuetify-nuxt-module'] },
    // Nuxt + All
    { name: 'nuxt-all', args: ['--type=nuxt', '--features=pinia,eslint,vuetify-nuxt-module'] },
  ]

  for (const { name, args } of matrix) {
    it(`should create project ${name}`, async () => {
      const projectName = `test-${name}`
      const projectPath = path.join(TEMP_DIR, projectName)

      // Clean up previous run
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true })
      }

      const cliArgs = [`--name=${projectName}`, ...args, '--package-manager=pnpm', '--force', '--no-install', '--no-interactive']

      console.log(`Running: create-vuetify ${cliArgs.join(' ')}`)
      const { stdout, stderr } = await runCli(cliArgs, TEMP_DIR)
      console.log('STDOUT:', stdout)
      if (stderr) {
        console.error('STDERR:', stderr)
      }

      expect(fs.existsSync(projectPath)).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true)

      // Basic check for file structure
      if (args.includes('vue')) {
        expect(fs.existsSync(path.join(projectPath, 'src/main.ts')) || fs.existsSync(path.join(projectPath, 'src/main.js'))).toBe(true)
      } else if (args.includes('nuxt')) {
        expect(fs.existsSync(path.join(projectPath, 'nuxt.config.ts'))).toBe(true)

        // Check for modules/vuetify.ts and dependencies
        const hasModuleFeature = args.some(arg => arg.includes('vuetify-nuxt-module'))
        if (hasModuleFeature) {
          expect(fs.existsSync(path.join(projectPath, 'modules/vuetify.ts'))).toBe(false)
        } else {
          expect(fs.existsSync(path.join(projectPath, 'modules/vuetify.ts'))).toBe(true)

          const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'))
          expect(pkg.devDependencies).toHaveProperty('vite-plugin-vuetify')
          expect(pkg.devDependencies).toHaveProperty('@vuetify/loader-shared')
          expect(pkg.devDependencies).toHaveProperty('pathe')
        }
      }
    }, TIMEOUT)
  }
})
