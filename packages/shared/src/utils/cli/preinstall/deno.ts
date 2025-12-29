import { i18n } from '@vuetify/cli-shared/i18n'
import { x } from 'tinyexec'

export default async function deno (root: string) {
  try {
    const { stdout } = await x('deno', ['--version'], { nodeOptions: { cwd: root } })
    const version = stdout.split('\n')[0].split(' ')[1]
    const [major] = version.split('.').map(Number)

    if (major < 2) {
      console.warn(i18n.t('messages.deno.version_warning', { version }))
    }
  } catch {
    //
  }
}
