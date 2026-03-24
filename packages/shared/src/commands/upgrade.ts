import { log } from '@clack/prompts'
import { defineCommand } from 'citty'
import { upgradeSelf } from '../functions/upgrade'
import { i18n } from '../i18n'

export function commandUpgradeFabric (pkgName: string) {
  return defineCommand({
    meta: {
      name: 'upgrade',
      description: i18n.t('commands.upgrade.description', { pkg: pkgName }),
    },
    run: async () => {
      log.warning(i18n.t('commands.upgrade.deprecated'))
      await upgradeSelf(pkgName)
    },
  })
}
