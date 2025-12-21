import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { downloadTemplate } from 'giget'

export async function installFeature (feature: string, cwd: string) {
  const templateName = `vue/${feature}`

  if (process.env.VUETIFY_CLI_TEMPLATES_PATH) {
    const templatePath = join(process.env.VUETIFY_CLI_TEMPLATES_PATH, templateName)
    if (existsSync(templatePath)) {
      cpSync(templatePath, cwd, { recursive: true })
    }
  } else {
    const tmp = mkdtempSync(join(tmpdir(), 'vuetify-feature-'))
    try {
      await downloadTemplate(`gh:vuetifyjs/templates/${templateName}`, {
        dir: tmp,
      })
      cpSync(tmp, cwd, { recursive: true })
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  }
}
