# Vuetify for VS Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/vuetify.vuetify)](https://marketplace.visualstudio.com/items?itemName=vuetify.vuetify) [![Installs](https://img.shields.io/visual-studio-marketplace/i/vuetify.vuetify)](https://marketplace.visualstudio.com/items?itemName=vuetify.vuetify) [![Reactive VSCode](https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863)](https://kermanx.com/reactive-vscode/)

The official VS Code extension for [Vuetify](https://vuetifyjs.com/).

## Features

### ⚡️ Snippets
Boost your productivity with auto-generated snippets for all Vuetify components. Simply type `v-` followed by the component name (e.g., `v-btn`, `v-card`).

### 📚 Documentation Integration
Access Vuetify documentation directly from your editor:
- **Hover**: Hover over any Vuetify component tag to see links to its API and Component documentation.
- **Context Menu**: Right-click on a component and select **Vuetify > Open API/Component Documentation**.
- **Quick Fix**: Use the lightbulb icon (Code Actions) to quickly open docs.

### 🚀 Project Creation
Start a new project easily with the **Vuetify: Create Project** command.

## Commands

- `Vuetify: Create Project` - Scaffold a new Vuetify project.
- `Vuetify: Open API Documentation` - Open the API docs for the component under the cursor.
- `Vuetify: Open Component Documentation` - Open the guide page for the component under the cursor.

## Development

This extension is built with [reactive-vscode](https://kermanx.com/reactive-vscode/).

### Directory Structure

- `package.json` - Manifest file declaring the extension and commands.
- `src/extension.ts` - Main entry point.
- `src/commands/` - Command implementations.
- `src/providers.ts` - Hover and Code Action providers.

### Get Started

1. Open this repository in VS Code.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm dev` to compile and watch for changes.
4. Press `F5` to open a new window with the extension loaded.
5. Set breakpoints in `src/extension.ts` to debug.

### Make Changes

- Relaunch the extension from the debug toolbar after changing code.
- Reload (`Ctrl+R` or `Cmd+R`) the VS Code window to apply changes.
x