<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.vuetifyjs.com/docs/images/one/logos/vcli-logo-dark.svg">
    <img alt="Vuetify CLI Logo" src="https://cdn.vuetifyjs.com/docs/images/one/logos/vcli-logo-light.svg" height="100">
  </picture>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@vuetify/cli"><img src="https://img.shields.io/npm/v/@vuetify/cli.svg" alt="npm version"></a>
  <a href="https://npm.chart.dev/@vuetify/cli"><img src="https://img.shields.io/npm/dm/@vuetify/cli?color=blue" alt="npm downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://community.vuetifyjs.com"><img src="https://discordapp.com/api/guilds/340160225338195969/widget.png" alt="Discord"></a>
</p>

# Vuetify CLI

Official CLI tools for scaffolding and managing Vuetify projects.

## Repository Structure

This is a **pnpm monorepo** containing:

| Package | Description |
|---------|-------------|
| [`@vuetify/cli`](./packages/cli) | The main `vuetify` command line tool |
| [`create-vuetify`](./packages/create) | Scaffolding tool for Vuetify projects |
| [`create-vuetify0`](./packages/create0) | Scaffolding tool for Vuetify 0 projects |
| [`@vuetify/cli-shared`](./packages/shared) | Shared utilities and logic |

## Requirements

- **Node.js** >= 18
- **pnpm** >= 9

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Lint
pnpm lint
```

## License

[MIT License](./LICENSE)
