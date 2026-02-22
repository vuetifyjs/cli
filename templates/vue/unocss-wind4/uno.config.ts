import { defineConfig, presetWind4, transformerDirectives, variantMatcher } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  variants: [
    variantMatcher('dark', (input: string) => ({
      matcher: input,
      selector: (s: string) => `.v-theme--dark ${s}, .v-theme--dark${s}`,
    })),
    variantMatcher('light', (input: string) => ({
      matcher: input,
      selector: (s: string) => `.v-theme--light ${s}, .v-theme--light${s}`,
    })),
  ],
  preflights: [
    {
      getCSS: () => `
:root {
  --font-heading: "Roboto", sans-serif;
  --font-body: "Roboto", sans-serif;
  --font-mono: "Roboto Mono", monospace;
}
`,
    },
  ],
  theme: {
    fontFamily: {
      heading: 'var(--font-heading)',
      body: 'var(--font-body)',
      mono: 'var(--font-mono)',
    },
    colors: {
      primary: {
        100: '#a7e0ff',
        900: '#003256',
      },
      secondary: {
        100: '#92f7ff',
        200: '#57f0ff',
        300: '#10e3fb',
        400: '#00c1da',
        500: '#009fbd',
        600: '#0087a4',
        700: '#097088',
        800: '#0d5d73',
      },
    },
    breakpoints: {
      xs: '0px',
      sm: '400px',
      md: '840px',
      lg: '1145px',
      xl: '1545px',
      xxl: '2138px',
    },
  },
})
