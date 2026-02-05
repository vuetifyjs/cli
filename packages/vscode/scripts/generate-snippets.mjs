import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUTPUT_FILE = resolve(ROOT, 'snippets/vuetify.json')

async function fetchWebTypes () {
  const urls = [
    'https://unpkg.com/vuetify/dist/json/web-types.json',
    'https://cdn.jsdelivr.net/npm/vuetify/dist/json/web-types.json',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        return await res.json()
      }
    } catch (error) {
      console.error(`Failed to fetch ${url}`, error)
    }
  }
  throw new Error('Failed to fetch web-types')
}

function kebabCase (str) {
  return str
    .replace(/^V([A-Z])/, 'v-$1')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function getAttributes (component) {
  const attributes = []
  const props = component.attributes || []

  // Common useful props
  // We don't want to overload the snippet, so we pick high-value props
  const common = [
    'text', // Cards, Alerts, etc.
    'title', // Cards, Alerts
    'label', // Inputs
    'items', // Selects
    'src', // Images
  ]

  let index = 1

  for (const name of common) {
    if (props.some(p => p.name === name)) {
      attributes.push(`${name}="\${${index}}"`)
      index++
    }
  }

  for (const prop of props) {
    if (prop.required && !common.includes(prop.name) && prop.name !== 'modelValue') {
      attributes.push(`${prop.name}="\${${index}}"`)
      index++
    }
  }

  return attributes.length > 0 ? ' ' + attributes.join(' ') : ''
}

async function main () {
  console.log('Fetching web-types...')
  const webTypes = await fetchWebTypes()
  if (!webTypes || !webTypes.contributions || !webTypes.contributions.html || !webTypes.contributions.html.tags) {
    console.error('Invalid web-types structure', webTypes)
    return
  }
  const components = webTypes.contributions.html.tags
  console.log(`Found ${components.length} components in web-types`)
  const snippets = {}

  for (const component of components) {
    const name = component.name

    if (!name.startsWith('V')) {
      continue
    }

    const kebab = kebabCase(name)

    const pascal = name

    const attrs = getAttributes(component)

    snippets[pascal] = {
      prefix: kebab,
      body: [
        `<${kebab}${attrs}>`,
        '\t$0',
        `</${kebab}>`,
      ],
      description: component.description || `Vuetify ${name} Component`,
    }
  }

  await fs.mkdir(dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(snippets, null, 2))
  console.log(`Generated snippets for ${Object.keys(snippets).length} components at ${OUTPUT_FILE}`)
}

main().catch(console.error)
