# Project Rules

## General
- This is a monorepo managed with `pnpm`.
- Use TypeScript for all code.
- Prefer `pnpm` for running commands.
- Follow the existing code style and patterns.

## Vuetify0
**IMPORTANT**: Vuetify0 is **NOT** a legacy version. It is a lightweight, modular, meta framework for building UI frameworks with Vue.js.

## CLI Structure
- **packages/cli**: Main entry point for the `vuetify` command.
- **packages/create**: Logic for `create-vuetify`.
- **packages/create-v0**: Logic for `create-vuetify-v0`.
- **packages/v0-cli**: Logic for `vuetify0` CLI.
- **packages/shared**: Shared utilities, commands, and logic (downloading templates, i18n, etc.).
- **packages/vscode**: VS Code extension.

## Development
- Use `tsdown` for building packages.
- When adding new features to the CLI, consider if the logic belongs in `shared` to be reusable across `cli`, `create`, `create-v0`, `v0-cli`, and `vscode`.

## Package versions
- when adding packages/shared/src/features/dependencies/package.json, make sure to run npm view to get actual versions of each package