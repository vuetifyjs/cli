import { downloadVuetifyTemplate, downloadVuetifyV0Template } from '@vuetify/cli-shared'
import { detectPackageManager } from 'nypm'
import { resolve } from 'pathe'
import { commands, type QuickPickItem, Uri, window, workspace } from 'vscode'

interface TemplateItem extends QuickPickItem {
  value: 'latest' | 'v0'
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

  // 3. Select Template Version
  const template = await window.showQuickPick<TemplateItem>(
    [
      {
        label: 'Vuetify 3 (Latest)',
        description: 'Standard Vuetify 3 project',
        value: 'latest',
        picked: true,
      },
      {
        label: 'Vuetify 0 (experimental)',
        description: 'Try newest Vuetify 0',
        value: 'v0',
      },
    ],
    {
      placeHolder: 'Select Vuetify version',
    },
  )

  if (!template) {
    return
  }

  const targetDir = resolve(cwd, projectName)

  // 4. Download Template
  await window.withProgress(
    {
      location: 15, // Notification
      title: `Creating Vuetify project in ${projectName}...`,
      cancellable: false,
    },
    async () => {
      try {
        const downloader = template.value === 'latest'
          ? downloadVuetifyTemplate
          : downloadVuetifyV0Template

        await downloader({
          cwd,
          dir: targetDir,
          force: true,
        })
      } catch (error) {
        window.showErrorMessage(`Failed to create project: ${error}`)
        throw error
      }
    },
  )

  // 5. Prompt to Install Dependencies
  const installSelection = await window.showQuickPick(
    ['Yes', 'No'],
    {
      placeHolder: 'Install dependencies?',
    },
  )

  if (installSelection === 'Yes') {
    const pm = await detectPackageManager(targetDir)
    const terminal = window.createTerminal({
      name: 'Install Vuetify',
      cwd: targetDir,
    })
    terminal.show()
    terminal.sendText(`${pm?.name || 'npm'} install`)
  }

  // 6. Open Project
  const openSelection = await window.showInformationMessage(
    'Project created successfully. Open it now?',
    'Open in New Window',
    'Add to Workspace',
  )

  if (openSelection === 'Open in New Window') {
    commands.executeCommand('vscode.openFolder', Uri.file(targetDir), true)
  } else if (openSelection === 'Add to Workspace') {
    workspace.updateWorkspaceFolders(
      workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
      0,
      { uri: Uri.file(targetDir), name: projectName },
    )
  }
}
