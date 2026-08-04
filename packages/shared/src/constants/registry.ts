/** Static origin publishing the `vuetify add` registry. */
export const REGISTRY_ORIGIN = 'https://0.vuetifyjs.com'

/** Registry payload version this CLI understands. */
export const REGISTRY_VERSION = 1

export const V0 = '@vuetify/v0'

/**
 * Factory installed in app code — used when scanning for an existing setup.
 * User-facing copy names the docs surface instead (`THEME_PLUGIN_LABEL`).
 */
export const THEME_PLUGIN = 'createThemePlugin'

/** Docs / registry name users recognize. */
export const THEME_PLUGIN_LABEL = 'useTheme'

/** Registry item / CLI argument for `vuetify add`. */
export const THEME_PLUGIN_COMMAND = 'use-theme'

export const REGISTRY_TIMEOUT = 15_000

export const UNOCSS_CONFIGS = [
  'uno.config.ts',
  'uno.config.js',
  'uno.config.mjs',
  'unocss.config.ts',
  'unocss.config.js',
  'unocss.config.mjs',
]
