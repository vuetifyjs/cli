import type { PackageJson } from 'pkg-types'
import { DEFAULT_VUETIFY_MCP_SERVER_ID, DEFAULT_VUETIFY_REMOTE_URL } from '../mcp-core'

export interface ProjectDocsOptions {
  name: string
  platform: 'vue' | 'nuxt'
  type: 'vuetify' | 'vuetify0'
  features: string[]
  typescript: boolean
  packageManager?: string
  scripts?: PackageJson['scripts']
}

const featureLabels: Record<string, string> = {
  'router': 'Vue Router',
  'file-router': 'File Router',
  'pinia': 'Pinia',
  'i18n': 'Vue I18n',
  'eslint': 'ESLint',
  'mcp': 'Vuetify MCP',
  'client-hints': 'Client Hints',
  'unocss': 'UnoCSS',
  'unocss-vuetify': 'UnoCSS + Vuetify Preset',
  'unocss-wind4': 'UnoCSS + Wind4',
  'tailwindcss': 'Tailwind CSS',
  'css-none': 'Default Vuetify Styles',
}

function getPackageManager (value?: string) {
  if (value === 'npm' || value === 'pnpm' || value === 'yarn' || value === 'bun' || value === 'deno') {
    return value
  }
  return 'npm'
}

function runScriptCommand (pm: string, script: string) {
  if (pm === 'npm') {
    return `npm run ${script}`
  }
  if (pm === 'deno') {
    return `deno task ${script}`
  }
  return `${pm} ${script}`
}

function installCommand (pm: string) {
  if (pm === 'yarn' || pm === 'bun') {
    return `${pm} install`
  }
  if (pm === 'pnpm') {
    return 'pnpm install'
  }
  if (pm === 'deno') {
    return 'deno install'
  }
  return 'npm install'
}

function frameworkLabel (platform: ProjectDocsOptions['platform']) {
  return platform === 'nuxt' ? 'Nuxt 4' : 'Vue 3 + Vite'
}

function uiLabel (type: ProjectDocsOptions['type']) {
  return type === 'vuetify0' ? 'Vuetify0' : 'Vuetify'
}

function docsLink (type: ProjectDocsOptions['type']) {
  return type === 'vuetify0' ? 'https://0.vuetifyjs.com/' : 'https://vuetifyjs.com/'
}

function featureList (features: string[]) {
  if (features.length === 0) {
    return '- Base setup'
  }
  return features
    .map(feature => `- ${featureLabels[feature] ?? feature}`)
    .join('\n')
}

function projectStructure (platform: ProjectDocsOptions['platform'], typescript: boolean) {
  if (platform === 'nuxt') {
    return `- \`app/pages/\` — application routes
- \`app/components/\` — reusable Vue components
- \`app/assets/\` — styles and static assets used in app
- \`app/plugins/\` — Nuxt plugins
- \`public/\` — static public files`
  }

  return `- \`src/main.${typescript ? 'ts' : 'js'}\` — application entry point
- \`src/App.vue\` — root component
- \`src/components/\` — reusable Vue components
- \`src/plugins/\` — plugin registration and setup
- \`src/styles/\` — global styles and theme settings
- \`public/\` — static public files`
}

function formatScripts (scripts: ProjectDocsOptions['scripts'], pm: string) {
  if (!scripts) {
    return '- No scripts found'
  }
  const items = Object
    .entries(scripts)
    .filter(([, value]) => typeof value === 'string')
    .map(([name]) => `- \`${runScriptCommand(pm, name)}\``)

  if (items.length === 0) {
    return '- No scripts found'
  }
  return items.join('\n')
}

function dlxCommand (pm: string, pkg: string) {
  if (pm === 'pnpm' || pm === 'yarn') {
    return `${pm} dlx ${pkg}`
  }
  if (pm === 'bun') {
    return `bunx ${pkg}`
  }
  return `npx -y ${pkg}`
}

function mcpReadmeSection (pm: string) {
  return `
## 🤖 Vuetify MCP Server

This project is wired to the hosted Vuetify MCP server (\`${DEFAULT_VUETIFY_REMOTE_URL}\`). Client config is already in the repo:

- Cursor: \`.cursor/mcp.json\`
- Claude Code: \`.mcp.json\` — approve/enable the project server when prompted
- Grok: \`.grok/config.toml\` (also reads \`.mcp.json\` / \`.cursor/mcp.json\` as compat)
- Codex: \`.codex/config.toml\` — project must be trusted for Codex to load project config
- Kimi Code: \`.kimi-code/mcp.json\` — approve workspace trust when prompted

You do not need to run \`claude mcp add\` or \`grok mcp add\` if your client loads those files.

If a client ignores project files, you can add the server yourself:

\`\`\`bash
claude mcp add --transport http --scope project ${DEFAULT_VUETIFY_MCP_SERVER_ID} ${DEFAULT_VUETIFY_REMOTE_URL}
grok mcp add --transport http --scope project ${DEFAULT_VUETIFY_MCP_SERVER_ID} ${DEFAULT_VUETIFY_REMOTE_URL}
codex mcp add ${DEFAULT_VUETIFY_MCP_SERVER_ID} --url ${DEFAULT_VUETIFY_REMOTE_URL}
\`\`\`

For Kimi Code, use the TUI \`/mcp-config\` command if project files are ignored.

For other IDEs (VS Code, Windsurf, Trae, Claude Desktop), run \`${dlxCommand(pm, '@vuetify/mcp-cli')}\` or \`vuetify mcp install\`.
`
}

export function getProjectGitignore (options: ProjectDocsOptions) {
  if (options.platform === 'nuxt') {
    return `# Nuxt dev/build outputs
.output
.data
.nuxt
.nitro
.cache
dist

# Node dependencies
node_modules

# Logs
logs
*.log

# Misc
.DS_Store
.fleet
.idea

# Local env files
.env
.env.*
!.env.example
`
  }

  return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
.DS_Store
dist
dist-ssr
coverage
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

*.tsbuildinfo
`
}

export function getProjectAgentsMd (options: ProjectDocsOptions) {
  const pm = getPackageManager(options.packageManager)
  const enabledFeatures = options.features.length > 0
    ? options.features.map(feature => featureLabels[feature] ?? feature).join(', ')
    : 'Base setup'

  return `# Project Rules

## General
- Follow the existing code style and patterns.
- Use ${pm} for running project commands.
- Keep code in ${options.typescript ? 'TypeScript' : 'JavaScript'} unless migration is required.

## Stack
- Framework: ${frameworkLabel(options.platform)}
- UI Library: ${uiLabel(options.type)}
- Enabled Features: ${enabledFeatures}
${options.features.includes('mcp')
  ? `
## MCP
- Client config is already written (\`.cursor/mcp.json\`, \`.mcp.json\`, \`.grok/config.toml\`, \`.codex/config.toml\`, \`.kimi-code/mcp.json\`).
- Claude Code: approve the project server if prompted.
`
  : ''}
`
}

export function getProjectReadmeMd (options: ProjectDocsOptions) {
  const pm = getPackageManager(options.packageManager)
  const install = installCommand(pm)
  const dev = runScriptCommand(pm, 'dev')
  const build = runScriptCommand(pm, 'build')
  const mainEntry = options.platform === 'nuxt'
    ? 'app/app.vue'
    : `src/main.${options.typescript ? 'ts' : 'js'}`
  const docs = docsLink(options.type)

  return `# ${options.name}

Scaffolded with Vuetify CLI.

## ❗️ Documentation

- Primary docs: ${docs}
- Getting started guide: ${docs}${options.type === 'vuetify0' ? 'guide' : 'en/getting-started/installation/'}
- Community support: https://community.vuetifyjs.com/
- Issue tracker: https://issues.vuetifyjs.com/

## 🧱 Stack

- Framework: ${frameworkLabel(options.platform)}
- UI Library: ${uiLabel(options.type)}
- Language: ${options.typescript ? 'TypeScript' : 'JavaScript'}
- Package manager: ${pm}

## 🧭 Start Here

- Main entry: \`${mainEntry}\`
- Main app component: \`${options.platform === 'nuxt' ? 'app/app.vue' : 'src/App.vue'}\`
- Main styles: \`${options.platform === 'nuxt' ? 'app/assets/styles/' : 'src/styles/'}\`
- Plugin setup: \`${options.platform === 'nuxt' ? 'app/plugins/' : 'src/plugins/'}\`

## 📁 Project Structure

${projectStructure(options.platform, options.typescript)}

## ✨ Enabled Features

${featureList(options.features)}

## 💿 Install

Use your selected package manager (${pm}) to install dependencies:

\`\`\`bash
${install}
\`\`\`

## 🚀 Quick Start

\`\`\`bash
${install}
${dev}
\`\`\`

## 🏗️ Build

\`\`\`bash
${build}
\`\`\`

## 🧪 Available Scripts

${formatScripts(options.scripts, pm)}
${options.features.includes('mcp') ? mcpReadmeSection(pm) : ''}
## 💪 Support Vuetify Development

This project uses ${uiLabel(options.type)} - an MIT licensed Open Source project. We are glad to welcome contributors and any support for ongoing development:

- Contribute to Vuetify and ecosystem projects: https://github.com/vuetifyjs
- Request enterprise support: https://support.vuetifyjs.com/
- Sponsor on GitHub: https://github.com/sponsors/vuetifyjs
- Support on Open Collective: https://opencollective.com/vuetify
`
}
