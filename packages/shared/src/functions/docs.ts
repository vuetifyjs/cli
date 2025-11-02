import open from 'open'
import { i18n } from '../i18n'
import { extractMajor } from '../utils/package'
import { tryResolveVuetifyVersion } from '../utils/vuetify'

export async function openVuetifyDocs (versionArg?: string, { cwd }: { cwd?: string } = {}) {
  const resolvedVersion = await tryResolveVuetifyVersion({ cwd })
  const usingManual = typeof versionArg === 'string' && versionArg.length > 0
  const major = extractMajor(usingManual ? versionArg! : resolvedVersion)

  let url
  switch (major) {
    case 1: {
      url = 'https://v15.vuetifyjs.com'
      break
    }
    case 2: {
      url = 'https://v2.vuetifyjs.com'
      break
    }
    default: {
      url = 'https://vuetifyjs.com'
    }
  }

  console.log(i18n.t('commands.docs.opening', { url }))
  await open(url)
}

export async function openVuetify0Docs () {
  const url = 'https://0.vuetifyjs.com'
  console.log(i18n.t('commands.docs.opening', { url }))
  await open(url)
}
