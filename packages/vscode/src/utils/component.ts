import type { Position, TextDocument } from 'vscode'

export function kebabCase (str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function getComponentAtPosition (document: TextDocument, position: Position): string | null {
  const wordRange = document.getWordRangeAtPosition(position, /(v-[a-z0-9-]+)|(V[A-Z][a-zA-Z0-9]+)/)
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
