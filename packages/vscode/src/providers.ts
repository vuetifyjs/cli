import { CodeAction, CodeActionKind, Hover, languages, MarkdownString } from 'vscode'
import { getComponentAtPosition } from './utils/component'

export function registerHoverProvider () {
  return languages.registerHoverProvider('vue', {
    provideHover (document, position) {
      const component = getComponentAtPosition(document, position)
      if (component) {
        const args = encodeURIComponent(JSON.stringify([component]))
        const api = `command:vuetify.openApiDocs?${args}`
        const comp = `command:vuetify.openComponentDocs?${args}`
        const md = new MarkdownString(`[Component Docs](${comp}) | [API Docs](${api}) `)
        md.isTrusted = true
        return new Hover(md)
      }
    },
  })
}

export function registerCodeActionProvider () {
  return languages.registerCodeActionsProvider('vue', {
    provideCodeActions (document, range) {
      const component = getComponentAtPosition(document, range.start)
      if (component) {
        const apiAction = new CodeAction('Open API Documentation', CodeActionKind.QuickFix)
        apiAction.command = {
          command: 'vuetify.openApiDocs',
          title: 'Open API Documentation',
          arguments: [component],
        }

        const compAction = new CodeAction('Open Component Documentation', CodeActionKind.QuickFix)
        compAction.command = {
          command: 'vuetify.openComponentDocs',
          title: 'Open Component Documentation',
          arguments: [component],
        }

        return [apiAction, compAction]
      }
    },
  })
}
