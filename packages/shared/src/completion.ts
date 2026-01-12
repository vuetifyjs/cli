export function registerProjectArgsCompletion (completion: any) {
  const typeOption = completion.options.get('type')
  if (typeOption) {
    typeOption.handler = (complete: any) => {
      complete('vuetify', 'Vuetify Project')
      complete('vuetify0', 'Vuetify0 Project')
    }
  }

  const platformOption = completion.options.get('platform')
  if (platformOption) {
    platformOption.handler = (complete: any) => {
      complete('vue', 'Vue')
      complete('nuxt', 'Nuxt')
    }
  }

  const routerOption = completion.options.get('router')
  if (routerOption) {
    routerOption.handler = (complete: any) => {
      complete('router', 'Vue Router')
      complete('file-router', 'Vue Router (File-based)')
      complete('none', 'None')
    }
  }

  const cssOption = completion.options.get('css')
  if (cssOption) {
    cssOption.handler = (complete: any) => {
      complete('unocss', 'UnoCSS')
      complete('tailwindcss', 'Tailwind CSS')
      complete('none', 'None')
    }
  }
}
