import { existsSync } from 'node:fs'
import { confirm, isCancel, log, outro, spinner, text } from '@clack/prompts'
import { downloadVuetifyV0Template } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { installDependencies } from 'nypm'
import { relative, resolve } from 'pathe'

export interface InstallOptions {
  cwd: string
  dir?: string
  force: boolean
  interactive: boolean
  name?: string
  defaultName: string
  install?: boolean
}

export async function initVuetify0 (options: InstallOptions) {
  const { cwd, dir, force, interactive, name, defaultName } = options

  let projectName = name ?? dir ?? defaultName
  if (!name && !dir && interactive) {
    const projectNameInput = await text({
      message: i18n.t('prompts.directory.name'),
      placeholder: defaultName,
      defaultValue: defaultName,
    })

    if (!isCancel(projectNameInput)) {
      projectName = projectNameInput
    }
  }

  const targetDir = resolve(cwd, projectName)
  const relativeDir = relative(cwd, targetDir)

  let explicitForce = force

  try {
    if (!force && existsSync(targetDir)) {
      if (interactive) {
        const overwrite = await confirm({
          message: i18n.t('prompts.directory.overwrite', { dir: relativeDir }),
          initialValue: false,
        })

        if (!isCancel(overwrite) && overwrite) {
          explicitForce = true
        } else {
          return
        }
      } else {
        log.warn(i18n.t('prompts.directory.warn_exists', { dir: relativeDir }))
        return
      }
    }

    const downloadSpinner = spinner()
    downloadSpinner.start(i18n.t('commands.init.creating_project', { dir: relativeDir }))

    await downloadVuetifyV0Template({
      cwd,
      force: explicitForce,
      dir: targetDir,
    })

    downloadSpinner.stop(i18n.t('messages.project_created'))

    let shouldInstall = options.install

    if (typeof options.install !== 'boolean' && interactive) {
      const install = await confirm({
        message: i18n.t('prompts.install'),
      })

      if (!isCancel(install)) {
        shouldInstall = install
      }
    }

    if (shouldInstall) {
      const installSpinner = spinner()
      installSpinner.start(i18n.t('spinners.dependencies.installing'))
      try {
        await installDependencies({
          cwd: targetDir,
        })
        installSpinner.stop(i18n.t('spinners.dependencies.installed'))
      } catch (error) {
        installSpinner.stop(i18n.t('spinners.dependencies.failed'))
        throw error
      }
    }

    outro(i18n.t('messages.all_done'))
  } catch (error) {
    log.error('Installation failed')
    throw error
  }
}
