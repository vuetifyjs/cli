import fs from 'node:fs'
import path from 'node:path'
import { x } from 'tinyexec'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const CLI_PATH = path.resolve(__dirname, '../dist/index.mjs')
const TEMPLATES_PATH = path.resolve(__dirname, '../../../templates')
const TEMP_DIR = path.resolve(__dirname, '../.test-tmp-conflict')

describe('create-vuetify conflict', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR)
    }
  })

  afterAll(() => {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  })

  const runCli = async (args: string[], cwd: string) => {
    const proc = x('node', [CLI_PATH, ...args], {
      nodeOptions: {
        cwd,
        env: {
          ...process.env,
          VUETIFY_CLI_TEMPLATES_PATH: TEMPLATES_PATH,
        },
      },
      throwOnError: false,
    })

    for await (const line of proc) {
      console.log(line)
    }

    const result = await proc
    if (result.exitCode !== 0) {
      console.error('Command failed with exit code:', result.exitCode)
      console.error('STDERR:', result.stderr)
      throw new Error(`Process exited with non-zero status (${result.exitCode})`)
    }
    return result
  }

  it('should error when both router and file-router selected via flags', async () => {
    const projectName = 'test-conflict'
    const projectPath = path.join(TEMP_DIR, projectName)

    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true })
    }

    // Select both router and file-router
    const args = [
      `--name=${projectName}`,
      '--type=vue',
      '--typescript',
      '--features=router,file-router',
      '--package-manager=pnpm',
      '--force',
      '--no-install',
      '--no-interactive',
    ]

    console.log(`Running: create-vuetify ${args.join(' ')}`)

    try {
      await runCli(args, TEMP_DIR)
      expect.fail('Should have failed')
    } catch (error: any) {
      expect(error.message).toContain('Process exited with non-zero status (1)')
    }
  })
})
