import { scaffold } from '@vuetify/cli-shared'
import { commands, type QuickPickItem, Uri, window, workspace } from 'vscode'

interface TemplateItem extends QuickPickItem {
  value: 'vuetify' | 'vuetify0'
}

interface PlatformItem extends QuickPickItem {
  value: 'vue' | 'nuxt'
}

interface BoolItem extends QuickPickItem {
  value: boolean
}

interface FeatureItem extends QuickPickItem {
  value: string
}

interface StringItem extends QuickPickItem {
  value: string
}

export async function createProject () {
  // 1. Select Destination Directory
  const uri = await window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select Project Location',
  })

  if (!uri || uri.length === 0) {
    return
  }

  const cwd = uri[0].fsPath

  // 2. Input Project Name
  const projectName = await window.showInputBox({
    prompt: 'Enter project name',
    placeHolder: 'vuetify-app',
    validateInput: value => {
      if (!value) {
        return 'Project name is required'
      }
      if (!/^[a-z0-9-_]+$/.test(value)) {
        return 'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
      }
      return null
    },
  })

  if (!projectName) {
    return
  }

  // 3. Select Platform
  const platformItem = await window.showQuickPick<PlatformItem>(
    [
      { label: 'Vue', value: 'vue', description: 'Vue.js Framework', picked: true },
      { label: 'Nuxt', value: 'nuxt', description: 'Nuxt Framework' },
    ],
    { placeHolder: 'Select Framework' },
  )

  if (!platformItem) {
    return
  }
  const platform = platformItem.value

  // 4. Select Template Version
  const template = await window.showQuickPick<TemplateItem>(
    [
      {
        label: 'Vuetify 3 (Latest)',
        description: 'Standard Vuetify 3 project',
        value: 'vuetify',
        picked: true,
      },
      {
        label: 'Vuetify 0 (experimental)',
        description: 'Try newest Vuetify 0',
        value: 'vuetify0',
      },
    ],
    {
      placeHolder: 'Select Vuetify version',
    },
  )

  if (!template) {
    return
  }

  // 5. CSS Framework (only for Vuetify 0)
  let cssFramework = 'none'
  if (template.value === 'vuetify0') {
    const cssItem = await window.showQuickPick<StringItem>(
      [
        { label: 'UnoCSS', value: 'unocss', description: 'Instant on-demand atomic CSS engine', picked: true },
        { label: 'Tailwind CSS', value: 'tailwindcss', description: 'Utility-first CSS framework' },
        { label: 'None', value: 'none' },
      ],
      { placeHolder: 'Select CSS Framework' },
    )
    if (!cssItem) {
      return
    }
    cssFramework = cssItem.value
  }

  // 6. TypeScript
  const tsItem = await window.showQuickPick<BoolItem>(
    [
      { label: 'Yes', value: true, description: 'Use TypeScript', picked: true },
      { label: 'No', value: false, description: 'Use JavaScript' },
    ],
    { placeHolder: 'Use TypeScript?' },
  )

  if (!tsItem) {
    return
  }
  const typescript = tsItem.value

  // 7. Router (only for Vue)
  let router = 'none'
  if (platform === 'vue') {
    const routerItem = await window.showQuickPick<StringItem>(
      [
        { label: 'Vue Router', value: 'router', description: 'Standard Vue Router', picked: true },
        { label: 'File-based Router', value: 'file-router', description: 'unplugin-vue-router' },
        { label: 'None', value: 'none' },
      ],
      { placeHolder: 'Select Router' },
    )
    if (!routerItem) {
      return
    }
    router = routerItem.value
  }

  // 8. Features
  const featureOptions: FeatureItem[] = [
    { label: 'ESLint', value: 'eslint', picked: true },
    { label: 'MCP', value: 'mcp', description: 'Model Context Protocol', picked: true },
    { label: 'Pinia', value: 'pinia', picked: true },
    { label: 'i18n', value: 'i18n' },
  ]

  if (platform === 'nuxt' && template.value !== 'vuetify0') {
    featureOptions.push({
      label: 'Vuetify Nuxt Module',
      value: 'vuetify-nuxt-module',
      picked: true,
    })
  }

  const featureItems = await window.showQuickPick<FeatureItem>(
    featureOptions,
    {
      canPickMany: true,
      placeHolder: 'Select features',
    },
  )

  if (!featureItems) {
    return
  }
  let features = featureItems.map(item => item.value)

  // 9. Client Hints (only for Nuxt + vuetify-nuxt-module)
  let clientHints = false
  if (platform === 'nuxt' && features.includes('vuetify-nuxt-module')) {
    const hintsItem = await window.showQuickPick<BoolItem>(
      [
        { label: 'No', value: false, picked: true },
        { label: 'Yes', value: true, description: 'Enable Client Hints' },
      ],
      { placeHolder: 'Enable Client Hints?' },
    )
    if (!hintsItem) {
      return
    }
    clientHints = hintsItem.value
  }

  // 10. Package Manager
  const pmItem = await window.showQuickPick(
    ['npm', 'pnpm', 'yarn', 'bun', 'deno'],
    { placeHolder: 'Select Package Manager' },
  )

  if (!pmItem) {
    return
  }
  const packageManager = pmItem

  // 11. Install Dependencies
  const installItem = await window.showQuickPick<BoolItem>(
    [
      { label: 'Yes', value: true, description: 'Install dependencies after creation', picked: true },
      { label: 'No', value: false, description: 'Skip dependency installation' },
    ],
    {
      placeHolder: 'Install dependencies?',
    },
  )

  if (!installItem) {
    return
  }
  const install = installItem.value

  // Assemble features array
  if (router !== 'none') {
    features.push(router)
  }
  if (cssFramework !== 'none') {
    features.push(cssFramework)
  } else if (template.value === 'vuetify0' && cssFramework === 'none') {
    features.push('css-none')
  }

  // 12. Create Project
  await window.withProgress(
    {
      location: 15, // Notification
      title: `Creating Vuetify project in ${projectName}...`,
      cancellable: false,
    },
    async progress => {
      try {
        await scaffold({
          cwd,
          name: projectName,
          platform,
          type: template.value,
          features,
          typescript,
          packageManager,
          install,
          force: true,
          clientHints,
        }, {
          onDownloadStart: () => progress.report({ message: 'Downloading template...' }),
          onConfigStart: () => progress.report({ message: 'Applying configuration...' }),
          onConvertStart: () => progress.report({ message: 'Converting to JavaScript...' }),
          onInstallStart: pm => progress.report({ message: `Installing dependencies with ${pm}...` }),
        })
      } catch (error) {
        window.showErrorMessage(`Failed to create project: ${error}`)
        throw error
      }
    },
  )

  // 13. Open Project
  const openSelection = await window.showInformationMessage(
    'Project created successfully. Open it now?',
    'Open in New Window',
    'Add to Workspace',
  )

  const targetDir = Uri.file(`${cwd}/${projectName}`)

  if (openSelection === 'Open in New Window') {
    commands.executeCommand('vscode.openFolder', targetDir, true)
  } else if (openSelection === 'Add to Workspace') {
    workspace.updateWorkspaceFolders(
      workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
      0,
      { uri: targetDir, name: projectName },
    )
  }
}
