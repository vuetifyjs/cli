import type { Position, TextDocument, TextEditor, Uri } from 'vscode'
import componentMap from './component-map.json'

const RE_COMPONENT = /^(v-[a-z0-9-]+|V[A-Z][a-zA-Z0-9]+)$/
const RE_COMPONENT_LOOSE = /(v-[a-z0-9-]+)|(V[A-Z][a-zA-Z0-9]+)/
const RE_STRING_TO_KEBAB = /([a-z0-9])([A-Z])/g

export function kebabCase (str: string) {
  return str.replace(RE_STRING_TO_KEBAB, '$1-$2').toLowerCase()
}

export function getComponentAtPosition (document: TextDocument, position: Position): string | null {
  const wordRange = document.getWordRangeAtPosition(position, RE_COMPONENT_LOOSE)
  if (!wordRange) {
    return null
  }

  const word = document.getText(wordRange)
  let componentName = word

  componentName = word.startsWith('V') && !word.startsWith('V-') && !word.includes('-') ? kebabCase(word) : word.toLowerCase()

  if (!componentName.startsWith('v-')) {
    componentName = `v-${componentName}`
  }

  return componentName
}

export function resolveComponentName (componentName: string | Uri | undefined, editor: TextEditor | undefined) {
  let resolved: string | undefined

  if (typeof componentName === 'string' && RE_COMPONENT.test(componentName.trim())) {
    resolved = componentName.trim()
  } else if (editor) {
    const selection = editor.selection
    resolved = getComponentAtPosition(editor.document, selection.active) || undefined
  }

  if (!resolved || !Object.hasOwn(componentMap, resolved)) {
    return undefined
  }

  return resolved
}
