import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { downloadTemplate } from 'giget'
import { join } from 'pathe'

export async function installFeature (feature: string, cwd: string, type: 'vuetify' | 'vuetify0' = 'vuetify') {
  const templateBase = type === 'vuetify0' ? 'vuetify0' : 'vue'
  const templateName = `${templateBase}/${feature}`

  if (process.env.VUETIFY_CLI_TEMPLATES_PATH) {
    const templatePath = join(process.env.VUETIFY_CLI_TEMPLATES_PATH, templateName)
    if (existsSync(templatePath)) {
      cpSync(templatePath, cwd, { recursive: true })
    }
  } else {
    const tmp = mkdtempSync(join(tmpdir(), 'vuetify-feature-'))
    try {
      await downloadTemplate(`gh:vuetifyjs/cli/templates/${templateName}`, {
        dir: tmp,
      })
      cpSync(tmp, cwd, { recursive: true })
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  }
}
