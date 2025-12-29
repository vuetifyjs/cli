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

  // 5. TypeScript
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

  // 6. Features
  const featureItems = await window.showQuickPick<FeatureItem>(
    [
      { label: 'Vue Router', value: 'router', picked: true },
      { label: 'Pinia', value: 'pinia', picked: true },
      { label: 'ESLint', value: 'eslint', picked: true },
    ],
    {
      canPickMany: true,
      placeHolder: 'Select features',
    },
  )

  if (!featureItems) {
    return
  }
  const features = featureItems.map(item => item.value)

  // 7. Package Manager
  const pmItem = await window.showQuickPick(
    ['npm', 'pnpm', 'yarn', 'bun'],
    { placeHolder: 'Select Package Manager' },
  )

  if (!pmItem) {
    return
  }
  const packageManager = pmItem

  // 8. Install Dependencies
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

  // 9. Create Project
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

  // 10. Open Project
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
