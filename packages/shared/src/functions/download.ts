import { downloadTemplate } from 'giget'
import { templateBuilder } from '../utils/template'

type DownloadTemplateOptions = {
  cwd?: string
  force?: boolean
  dir?: string
}

export async function downloadVuetifyV0Template (options: DownloadTemplateOptions = {}) {
  const repo = 'AndreyYolkin/vuetify-templates'
  const subDir = 'v0'

  const repoUrl = templateBuilder(repo, subDir)
  await downloadTemplate(repoUrl, {
    cwd: options.cwd,
    force: options.force ?? true,
    dir: options.dir ?? 'v0',
  })
}

downloadVuetifyV0Template()
