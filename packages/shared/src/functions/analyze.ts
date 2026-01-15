import type { AnalyzeReport, FeatureType, ParseError } from '../reporters/types'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'pathe'
import { readPackageJSON, resolvePackageJSON } from 'pkg-types'
import { glob } from 'tinyglobby'
import { parse } from 'vue-eslint-parser'
import { DirectoryNotFoundError, FileParseError } from '../errors'

const require = createRequire(import.meta.url)

async function loadImportMap (cwd: string, targetPackage: string) {
  try {
    const pkgPath = await resolvePackageJSON(targetPackage, { url: cwd })
    const pkgRoot = dirname(pkgPath)
    const mapPath = join(pkgRoot, 'dist/json/importMap.json')
    if (existsSync(mapPath)) {
      const content = await readFile(mapPath, 'utf8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.warn('Failed to load importMap.json', error)
  }
  return null
}

function getFeatureType (name: string, isType = false, importMap?: any): FeatureType {
  if (isType) {
    return 'type'
  }
  if (importMap?.components?.[name]) {
    return 'component'
  }
  if (name.startsWith('use') && name.length > 3 && name.at(3)?.match(/[A-Z]/)) {
    return 'composable'
  }
  if (/^create.*Plugin$/.test(name)) {
    return 'plugin'
  }
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return 'constant'
  }
  if (/^[A-Z]/.test(name)) {
    return 'component'
  }
  return 'util'
}

function walk (node: any, callback: (node: any, parent: any) => void, parent?: any) {
  if (!node || typeof node !== 'object') {
    return
  }

  callback(node, parent)

  for (const key in node) {
    if (key === 'parent' || key === 'loc' || key === 'range' || key === 'tokens' || key === 'comments') {
      continue
    }
    const child = node[key]
    if (Array.isArray(child)) {
      for (const item of child) {
        walk(item, callback, node)
      }
    } else {
      walk(child, callback, node)
    }
  }
}

export function analyzeCode (code: string, targetPackages: string[] = ['@vuetify/v0']) {
  const ast = parse(code, {
    sourceType: 'module',
    ecmaVersion: 2022,
    parser: require.resolve('@typescript-eslint/parser'),
  })

  const found = new Map<string, Map<string, { isType: boolean }>>()
  for (const pkg of targetPackages) {
    found.set(pkg, new Map())
  }

  if (ast.body) {
    // eslint-disable-next-line complexity
    walk(ast, (node, parent) => {
      // Static imports: import { X } from 'pkg'
      if (node.type === 'ImportDeclaration' && typeof node.source.value === 'string') {
        const targetPackage = targetPackages.find(pkg => node.source.value === pkg || node.source.value.startsWith(`${pkg}/`))
        if (targetPackage) {
          const packageFeatures = found.get(targetPackage)!
          const isDeclType = node.importKind === 'type'
          for (const spec of node.specifiers) {
            const isSpecType = spec.importKind === 'type'
            const isType = isDeclType || isSpecType

            if (spec.type === 'ImportSpecifier' && 'name' in spec.imported) {
              const name = spec.imported.name
              const current = packageFeatures.get(name)
              if (current) {
                if (!isType) {
                  current.isType = false
                }
              } else {
                packageFeatures.set(name, { isType })
              }
            } else if (spec.type === 'ImportDefaultSpecifier') {
              const name = 'default'
              const current = packageFeatures.get(name)
              if (current) {
                if (!isType) {
                  current.isType = false
                }
              } else {
                packageFeatures.set(name, { isType })
              }
            }
          }
        }
      }

      // Dynamic imports: import('pkg').then(...) or import('pkg')['prop']
      // Node structure for import('pkg'): { type: 'ImportExpression', source: { value: 'pkg' } }
      if (node.type === 'ImportExpression'
        && parent?.type === 'MemberExpression' && parent.object === node) {
        const targetPackage = targetPackages.find(pkg => node.source.value === pkg)
        if (targetPackage) {
          const packageFeatures = found.get(targetPackage)!
          if (parent.property.type === 'Identifier' && !parent.computed) {
            // .Prop
            if (parent.property.name === 'then') {
              return
            }
            const name = parent.property.name
            const current = packageFeatures.get(name)
            if (current) {
              current.isType = false
            } else {
              packageFeatures.set(name, { isType: false })
            }
          } else if (parent.property.type === 'Literal') {
            // ['Prop']
            const name = parent.property.value
            const current = packageFeatures.get(name)
            if (current) {
              current.isType = false
            } else {
              packageFeatures.set(name, { isType: false })
            }
          }
        }
      }
      // Case 2: (await import('pkg')).Prop
      // AwaitExpression -> MemberExpression
      // parent is AwaitExpression
      // parent.parent is MemberExpression
      // We can't easily access parent.parent with simple walk unless we pass it down or track path.
      // But our walk function passes `parent`.
      // So we need to check if we are inside an AwaitExpression, and that AwaitExpression is part of MemberExpression.
      // This direction (upwards) is hard if we only have one level of parent.
      // Instead, let's catch MemberExpression and check if object is AwaitExpression -> ImportExpression

      // Handle (await import('pkg')).Prop
      if (node.type === 'MemberExpression' // Check if object is AwaitExpression
        && node.object.type === 'AwaitExpression' && node.object.argument.type === 'ImportExpression') {
        const source = node.object.argument.source.value
        const targetPackage = targetPackages.find(pkg => source === pkg)
        if (targetPackage) {
          const packageFeatures = found.get(targetPackage)!
          if (node.property.type === 'Identifier' && !node.computed) {
            const name = node.property.name
            const current = packageFeatures.get(name)
            if (current) {
              current.isType = false
            } else {
              packageFeatures.set(name, { isType: false })
            }
          } else if (node.property.type === 'Literal') {
            const name = node.property.value
            const current = packageFeatures.get(name)
            if (current) {
              current.isType = false
            } else {
              packageFeatures.set(name, { isType: false })
            }
          }
        }
      }
    })
  }

  return found
}

export async function analyzeProject (cwd: string = process.cwd(), targetPackages: string[] = ['@vuetify/v0']): Promise<AnalyzeReport[]> {
  if (!existsSync(cwd)) {
    throw new DirectoryNotFoundError(cwd)
  }

  const [files, importMaps, pkgs] = await Promise.all([
    glob(['**/*.{vue,ts,js,tsx,jsx}'], {
      cwd,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      absolute: true,
    }),
    Promise.all(targetPackages.map(pkg => loadImportMap(cwd, pkg))),
    Promise.all(targetPackages.map(pkg => readPackageJSON(pkg, { url: cwd }).catch(() => null))),
  ])

  const features = new Map<string, Map<string, { isType: boolean }>>()
  for (const pkg of targetPackages) {
    features.set(pkg, new Map())
  }

  const parseErrors: ParseError[] = []

  for (const file of files) {
    try {
      const code = await readFile(file, 'utf8')
      const fileFeatures = analyzeCode(code, targetPackages)
      for (const [pkg, pkgFeatures] of fileFeatures) {
        const globalPkgFeatures = features.get(pkg)!
        for (const [name, info] of pkgFeatures) {
          const current = globalPkgFeatures.get(name)
          if (current) {
            if (!info.isType) {
              current.isType = false
            }
          } else {
            globalPkgFeatures.set(name, { isType: info.isType })
          }
        }
      }
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error(String(error_))
      const parseError = new FileParseError(file, error)
      parseErrors.push({
        file: relative(cwd, file),
        error: error.message,
      })
      // Log in debug mode if needed, but don't swallow silently
      if (process.env.DEBUG) {
        console.warn(parseError.toString())
      }
    }
  }

  return targetPackages.map((pkgName, index) => {
    const pkgFeatures = features.get(pkgName)!
    const importMap = importMaps[index]
    const pkgInfo = pkgs[index]

    return {
      meta: {
        packageName: pkgInfo?.name || pkgName,
        version: pkgInfo?.version || 'unknown',
      },
      features: Array.from(pkgFeatures.keys()).toSorted().map(name => ({
        name,
        type: getFeatureType(name, pkgFeatures.get(name)?.isType, importMap),
      })),
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
    }
  })
}
