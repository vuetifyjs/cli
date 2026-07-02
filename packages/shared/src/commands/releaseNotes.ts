import { intro, log, outro, spinner } from '@clack/prompts'
import { defineCommand } from 'citty'
import { cyan } from 'kolorist'
import { fetchReleaseNotes } from '../functions/releaseNotes'
import { i18n } from '../i18n'

export const releaseNotes = defineCommand({
  meta: {
    name: 'release-notes',
    description: i18n.t('commands.releaseNotes.description'),
  },
  args: {
    package: {
      type: 'positional',
      required: false,
      default: 'vuetify',
      description: i18n.t('commands.releaseNotes.package.description'),
    },
    version: {
      type: 'string',
      alias: 'v',
      default: 'latest',
      description: i18n.t('commands.releaseNotes.version.description'),
    },
  },
  run: async ({ args }) => {
    intro(i18n.t('commands.releaseNotes.intro'))
    const s = spinner()
    s.start(i18n.t('commands.releaseNotes.fetching'))

    try {
      const release = await fetchReleaseNotes(args.package, args.version)
      s.stop(i18n.t('commands.releaseNotes.fetched', { name: release.name }))

      log.info(i18n.t('commands.releaseNotes.tag', { tag: release.tag }))
      log.info(i18n.t('commands.releaseNotes.published', { date: new Date(release.publishedAt).toLocaleDateString() }))
      log.info(i18n.t('commands.releaseNotes.url', { url: cyan(release.url) }))

      console.log(`\n${release.body || i18n.t('commands.releaseNotes.empty')}\n`)
      outro(i18n.t('commands.releaseNotes.done'))
    } catch (error) {
      s.stop(i18n.t('commands.releaseNotes.failed_stop'))
      log.error((error as Error).message)
      process.exitCode = 1
    }
  },
})
