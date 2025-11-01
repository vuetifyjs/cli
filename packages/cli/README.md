# @vuetify/cli

CLI utilities and commands for Vuetify.

## Usage

### Global installation

You can install the CLI globally using `npm`, `pnpm`, `yarn`, or `bun`:

```sh
# npm
npm install -g @vuetify/cli

# pnpm
pnpm add -g @vuetify/cli

# yarn
yarn global add @vuetify/cli

# bun
bun add -g @vuetify/cli
```

then you can run the CLI using `vuetify` in your terminal.

```sh
vuetify --help
```

### Local usage

Without installation, you can run the CLI using `npx`:

```sh
# npm
npx @vuetify/cli

# pnpm
pnpm dlx @vuetify/cli

# yarn
yarn dlx @vuetify/cli

# bun
bunx @vuetify/cli

# deno
deno run -A npm:@vuetify/cli
```

## Status

Work in progress.

## Development

From the monorepo root:

- Install deps: `pnpm install`
- Build: `pnpm -F @vuetify/cli run build`

## License

MIT