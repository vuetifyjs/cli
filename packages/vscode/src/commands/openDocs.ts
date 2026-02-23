import { env, Uri, window } from 'vscode'
import { getComponentAtPosition } from '../utils/component'
import componentMap from '../utils/component-map.json'

async function openDocs (type: 'api' | 'component', componentName?: string) {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  if (!componentName) {
    const selection = editor.selection
    componentName = getComponentAtPosition(editor.document, selection.active) || undefined
  }

  if (!componentName) {
    window.showInformationMessage('No Vuetify component found at cursor position')
    return
  }

  const baseUrl = 'https://vuetifyjs.com/en'

  let url = baseUrl

  if (type === 'component') {
    const slug = (componentMap as Record<string, string>)[componentName]

    url = slug
      ? `${baseUrl}/components/${slug}`
      : `${baseUrl}/components/${componentName}`
  } else if (type === 'api') {
    url = `${baseUrl}/api/${componentName}`
  }

  await env.openExternal(Uri.parse(url))
}

export async function openApiDocs (componentName?: string) {
  await openDocs('api', componentName)
}

export async function openComponentDocs (componentName?: string) {
  await openDocs('component', componentName)
}
