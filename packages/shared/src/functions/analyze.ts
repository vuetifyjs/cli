import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { glob } from 'tinyglobby'
import { parse } from 'vue-eslint-parser'

const require = createRequire(import.meta.url)

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

export function analyzeCode (code: string, targetPackage = '@vuetify/v0') {
  const ast = parse(code, {
    sourceType: 'module',
    ecmaVersion: 2022,
    parser: require.resolve('@typescript-eslint/parser'),
  })

  const found = new Set<string>()
  const importedFromVuetify = new Set<string>()

  if (ast.body) {
    walk(ast, (node, parent) => {
      // Static imports: import { X } from 'pkg'
      if (node.type === 'ImportDeclaration' && typeof node.source.value === 'string' && (node.source.value === targetPackage || node.source.value.startsWith(`${targetPackage}/`))) {
        for (const spec of node.specifiers) {
          if (spec.type === 'ImportSpecifier' && 'name' in spec.imported) {
            found.add(spec.imported.name)
            importedFromVuetify.add(spec.local.name)
          } else if (spec.type === 'ImportDefaultSpecifier') {
            found.add('default')
            importedFromVuetify.add(spec.local.name)
          }
        }
      }

      // Dynamic imports: import('pkg').then(...) or import('pkg')['prop']
      // Node structure for import('pkg'): { type: 'ImportExpression', source: { value: 'pkg' } }
      if (node.type === 'ImportExpression' && node.source.value === targetPackage // Case 1: import('pkg')['Prop'] or import('pkg').Prop
        && parent?.type === 'MemberExpression' && parent.object === node) {
        if (parent.property.type === 'Identifier' && !parent.computed) {
          // .Prop
          found.add(parent.property.name)
        } else if (parent.property.type === 'Literal') {
          // ['Prop']
          found.add(parent.property.value)
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
        if (source === targetPackage) {
          if (node.property.type === 'Identifier' && !node.computed) {
            found.add(node.property.name)
          } else if (node.property.type === 'Literal') {
            found.add(node.property.value)
          }
        }
      }
    })
  }

  return Array.from(found)
}

export async function analyzeProject (cwd: string = process.cwd(), targetPackage = '@vuetify/v0') {
  const files = await glob(['**/*.{vue,ts,js,tsx,jsx}'], {
    cwd,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    absolute: true,
  })

  const features = new Set<string>()

  for (const file of files) {
    try {
      const code = await readFile(file, 'utf8')
      const fileFeatures = analyzeCode(code, targetPackage)
      for (const feature of fileFeatures) {
        features.add(feature)
      }
    } catch {
      // console.warn(`Failed to analyze ${file}:`, error)
    }
  }

  return Array.from(features).toSorted()
}
