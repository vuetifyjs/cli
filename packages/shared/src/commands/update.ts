import { intro, log, outro, spinner } from '@clack/prompts'
import { defineCommand } from 'citty'
import { green } from 'kolorist'
import { addDependency, addDevDependency } from 'nypm'
import { i18n } from '../i18n'
import { extractMajor, getNpmPackageVersion, getPackageVersion, getProjectPackageJSON } from '../utils'

export const update = defineCommand({
  meta: {
    name: 'update',
    description: i18n.t('commands.update.description'),
  },
  args: {
    nightly: {
      type: 'boolean',
      description: i18n.t('commands.update.nightly.description'),
    },
    packages: {
      type: 'string',
      description: i18n.t('commands.update.packages.description'),
    },
    verbose: {
      type: 'boolean',
      description: i18n.t('args.verbose.description'),
    },
  },
  run: async ({ args }) => {
    intro(i18n.t('commands.update.intro'))
    const s = spinner()

    const pkg = await getProjectPackageJSON()
    const deps = pkg.dependencies || {}
    const devDeps = pkg.devDependencies || {}
    const allDeps = { ...deps, ...devDeps }

    let packagesToUpdate: string[] = []
    let candidatesFound = false
    const isNightly = args.nightly

    if (isNightly) {
      if (allDeps['vuetify']) {
        packagesToUpdate = ['vuetify']
        candidatesFound = true
      } else {
        log.warning(i18n.t('commands.update.not_installed'))
        return
      }
    } else if (args.packages) {
      packagesToUpdate = args.packages.split(',').map(s => s.trim()).filter(Boolean)
      candidatesFound = packagesToUpdate.length > 0
    } else {
      const candidates: string[] = []
      for (const name of Object.keys(allDeps)) {
        if (
          name === 'vuetify'
          || name === '@nuxtjs/vuetify'
          || name === 'vuetify-nuxt-module'
          || name.startsWith('@vuetify/')
          || name.startsWith('@unvuetify/')
          || name === 'vite-plugin-vuetify'
          || name === 'eslint-plugin-vuetify'
          || name === 'eslint-config-vuetify'
        ) {
          candidates.push(name)
        }
      }
      packagesToUpdate = candidates
      candidatesFound = candidates.length > 0
    }

    if (!isNightly && packagesToUpdate.length > 0) {
      packagesToUpdate = await filterOutdatedPackages(packagesToUpdate)
    }

    if (packagesToUpdate.length === 0) {
      if (candidatesFound) {
        log.info(i18n.t('commands.update.all_updated'))
      } else {
        log.error(i18n.t('commands.update.packages.none'))
      }
      return
    }

    log.info(i18n.t('commands.update.packages.list', { pkgs: packagesToUpdate.join(', ') }))
    s.start(i18n.t('spinners.dependencies.installing'))

    const depsToUpdate: string[] = []
    const devDepsToUpdate: string[] = []

    for (const name of packagesToUpdate) {
      let version = '@latest'

      if (name === 'vuetify') {
        if (isNightly) {
          version = '@npm:@vuetify/nightly@latest'
        } else {
          const currentVersion = allDeps['vuetify']
          const major = extractMajor(currentVersion)

          if (major === 2) {
            version = '@2'
            log.warn(i18n.t('commands.update.deprecated_v2'))
          } else if (major === 1) {
            version = '@1'
            log.error(i18n.t('commands.update.outdated_v1'))
          }
        }
      }

      const isDev = !!devDeps[name]

      if (isDev) {
        devDepsToUpdate.push(name + version)
      } else {
        depsToUpdate.push(name + version)
      }
    }

    if (depsToUpdate.length > 0) {
      try {
        await addDependency(depsToUpdate, { silent: !args.verbose })
        s.message((i18n.t('spinners.dependencies.installed', { pkg: depsToUpdate.join(', ') })))
      } catch (error) {
        s.stop(i18n.t('spinners.dependencies.failed', { pkg: depsToUpdate.join(', ') }))
        log.error(error as string)
        return
      }
    }

    if (devDepsToUpdate.length > 0) {
      try {
        await addDevDependency(devDepsToUpdate, { silent: !args.verbose })
        s.message(green(i18n.t('spinners.dependencies.installed', { pkg: devDepsToUpdate.join(', ') })))
      } catch (error) {
        s.stop(i18n.t('spinners.dependencies.failed', { pkg: devDepsToUpdate.join(', ') }))
        log.error(error as string)
        return
      }
    }

    s.stop(i18n.t('commands.update.complete'))
    outro(i18n.t('commands.update.done'))
  },
})

async function filterOutdatedPackages (packages: string[]) {
  log.step(i18n.t('commands.update.checking'))

  const checkedPackages = await Promise.all(packages.map(async name => {
    const current = await getPackageVersion(name)
    const latest = await getNpmPackageVersion(name)

    if (current && latest && current === latest) {
      return { name, needsUpdate: false, version: latest }
    }
    return { name, needsUpdate: true }
  }))

  const toUpdate = []
  for (const { name, needsUpdate } of checkedPackages) {
    if (needsUpdate) {
      toUpdate.push(name)
    }
  }
  return toUpdate
}
