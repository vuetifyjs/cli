import { promises as fs } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { downloadTemplate } from 'giget'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const CACHE_DIR = resolve(ROOT, '.cache-docs')
const OUTPUT_FILE = resolve(ROOT, 'src/utils/component-map.json')

const SOURCES = [
  {
    name: 'components',
    url: 'gh:vuetifyjs/vuetify/packages/docs/src/pages/en/components#master',
  },
  {
    name: 'labs',
    url: 'gh:vuetifyjs/vuetify/packages/docs/src/pages/en/labs#master',
  },
]

function kebabCase (str) {
  return str
    .replace(/^V([A-Z])/, 'v-$1')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function pascalCase (str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

async function scanDir (dir, category, map) {
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const fullPath = join(dir, file)
      const stat = await fs.stat(fullPath)

      if (stat.isDirectory()) {
        await scanDir(fullPath, category, map)
      } else if (file.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf8')

        const relativePath = relative(map.root, fullPath)
        const slug = relativePath.replace(/\.md$/, '')

        const labelMatch = content.match(/label:\s*['"]?C:\s*(V[a-zA-Z0-9]+)['"]?/)
        if (labelMatch) {
          const componentName = labelMatch[1] // PascalCase
          const kebab = kebabCase(componentName)

          const finalSlug = category === 'labs' ? `labs/${slug}` : slug

          map.primary[kebab] = finalSlug
          map.primary[componentName] = finalSlug
        }

        const regex = /\|\s*\[(v-[a-z0-9-]+)\]/g
        let match
        while ((match = regex.exec(content)) !== null) {
          const componentName = match[1]
          const pascal = pascalCase(componentName)

          const finalSlug = category === 'labs' ? `labs/${slug}` : slug

          if (!map.secondary[componentName]) {
            map.secondary[componentName] = finalSlug
            map.secondary[pascal] = finalSlug
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error)
  }
}

async function main () {
  const map = {
    primary: {},
    secondary: {},
    root: '',
  }

  for (const source of SOURCES) {
    const downloadDir = resolve(CACHE_DIR, source.name)
    console.log(`Downloading ${source.name}...`)

    await downloadTemplate(source.url, {
      dir: downloadDir,
      force: true,
      preferOffline: false,
    })

    console.log(`Scanning ${source.name}...`)
    map.root = downloadDir
    await scanDir(downloadDir, source.name, map)
  }

  const finalMap = { ...map.secondary, ...map.primary }

  const overrides = {}
  Object.assign(finalMap, overrides)

  const keys = Object.keys(finalMap)
  keys.sort()
  const sortedMap = keys.reduce((acc, key) => {
    acc[key] = finalMap[key]
    return acc
  }, {})

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(sortedMap, null, 2))
  console.log(`Generated map with ${Object.keys(sortedMap).length} entries at ${OUTPUT_FILE}`)

  await fs.rm(CACHE_DIR, { recursive: true, force: true })
}

main().catch(console.error)
