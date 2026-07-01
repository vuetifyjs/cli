import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'pathe'
import { readPackageJSON, writePackageJSON } from 'pkg-types'

const RE_LANG_TS = /\s?lang="ts"/g
const RE_TS_EXT = /\.m?ts$/

const RE_TYPE_IMPORT = /^[ \t]*import\s+type\b.*\r?\n/gm
const RE_TYPE = String.raw`[A-Z][\w$.]*(?:<[^>]*>)?(?:\[\])?`
const RE_AS_SATISFIES = new RegExp(String.raw`\s+(?:as|satisfies)\s+${RE_TYPE}`, 'g')
const RE_DECL_ANNOTATION = new RegExp(String.raw`\b(const|let|var)(\s+[A-Za-z_$][\w$]*)\s*:\s*${RE_TYPE}(?=\s*=)`, 'g')
const RE_PARAM_ANNOTATION = new RegExp(String.raw`(\(\s*[A-Za-z_$][\w$]*)\s*:\s*${RE_TYPE}(?=\s*[,)])`, 'g')

function stripTypeScript (content: string) {
  return content
    .replace(RE_TYPE_IMPORT, '')
    .replace(RE_AS_SATISFIES, '')
    .replace(RE_DECL_ANNOTATION, '$1$2')
    .replace(RE_PARAM_ANNOTATION, '$1')
}

export async function convertProjectToJS (projectRoot: string) {
  // 1. Remove TS specific config files
  const filesToRemove = [
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'env.d.ts',
  ]
  for (const file of filesToRemove) {
    const path = join(projectRoot, file)
    if (existsSync(path)) {
      rmSync(path)
    }
  }

  // 2. Update package.json
  const pkgPath = join(projectRoot, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = await readPackageJSON(pkgPath)

    // Remove devDependencies
    const devDepsToRemove = [
      '@tsconfig/node22',
      '@types/node',
      '@vue/tsconfig',
      'typescript',
      'vue-tsc',
    ]
    if (pkg.devDependencies) {
      for (const dep of devDepsToRemove) {
        delete pkg.devDependencies[dep]
      }
      // Remove @types/*
      for (const dep of Object.keys(pkg.devDependencies)) {
        if (dep.startsWith('@types/')) {
          delete pkg.devDependencies[dep]
        }
      }
    }

    // Update scripts
    if (pkg.scripts) {
      delete pkg.scripts['type-check']
      delete pkg.scripts['build-only']
      if (pkg.scripts.build && pkg.scripts.build.includes('type-check')) {
        pkg.scripts.build = 'vite build'
      }
    }

    await writePackageJSON(pkgPath, pkg)
  }

  // 3. Rename and transform files
  function walk (dir: string) {
    const files = readdirSync(dir)
    for (const file of files) {
      const path = join(dir, file)
      const stat = statSync(path)
      if (stat.isDirectory()) {
        walk(path)
      } else {
        handleFile(path)
      }
    }
  }

  function handleFile (filePath: string) {
    if (filePath.endsWith('.vue')) {
      let content = readFileSync(filePath, 'utf8')
      // Remove lang="ts"
      content = content.replace(RE_LANG_TS, '')
      writeFileSync(filePath, content)
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.mts')) {
      const content = stripTypeScript(readFileSync(filePath, 'utf8'))

      // Rename file
      const newPath = filePath.replace(RE_TS_EXT, match => match === '.mts' ? '.mjs' : '.js')
      writeFileSync(newPath, content)
      rmSync(filePath)
    } else if (filePath.endsWith('index.html')) {
      let content = readFileSync(filePath, 'utf8')
      content = content.replace('src/main.ts', 'src/main.js')
      writeFileSync(filePath, content)
    }
  }

  walk(projectRoot)
}
