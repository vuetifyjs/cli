/* eslint-disable e18e/prefer-static-regex */
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'pathe'
import { afterEach, describe, expect, it } from 'vitest'
import { convertProjectToJS } from '../src/utils/convertProjectToJS'

const TEMPLATES = resolve(__dirname, '../../../templates')
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function convertTemplate (name: string) {
  const dir = mkdtempSync(join(tmpdir(), 'convert-'))
  dirs.push(dir)
  cpSync(join(TEMPLATES, name), dir, { recursive: true })
  return dir
}

function read (dir: string, pattern: RegExp) {
  const out: Record<string, string> = {}
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) {
        walk(p)
      } else if (pattern.test(p)) {
        out[p.slice(dir.length)] = readFileSync(p, 'utf8')
      }
    }
  }
  walk(dir)
  return out
}

describe('convertProjectToJS', () => {
  // The vue templates that go through TS->JS conversion.
  for (const name of ['vue/base', 'vue/unocss-wind4', 'vue/unocss-vuetify', 'vue/tailwind']) {
    it(`strips TS syntax from ${name}`, async () => {
      const dir = convertTemplate(name)
      await convertProjectToJS(dir)

      // No source file is left as .ts/.mts.
      expect(Object.keys(read(dir, /\.m?ts$/))).toEqual([])

      // No TS-only syntax survives in the emitted JS.
      for (const [file, content] of Object.entries(read(dir, /\.m?js$/))) {
        expect(content, `${file} has a type-only import`).not.toMatch(/\bimport\s+type\b/)
        expect(content, `${file} has a satisfies expression`).not.toMatch(/\bsatisfies\b/)
        expect(content, `${file} has a type annotation`).not.toMatch(/:\s*[A-Z][\w$.]*(?:<[^>]*>)?(?:\[\])?\s*[=,)]/)
        expect(content, `${file} has an as-cast`).not.toMatch(/\bas\s+[A-Z][\w$.]*</)
      }
    })
  }

  it('strips feature-copied SFCs (router overlaid on base)', async () => {
    // Mirrors scaffold: base template + a feature's template files, converted
    // as one final pass.
    const dir = convertTemplate('vue/base')
    cpSync(join(TEMPLATES, 'vue/router'), dir, { recursive: true })
    await convertProjectToJS(dir)

    for (const [file, content] of Object.entries(read(dir, /\.vue$/))) {
      expect(content, `${file} kept lang="ts"`).not.toMatch(/lang="ts"/)
    }
  })

  it('preserves runtime object literals and namespace imports', async () => {
    const dir = convertTemplate('vue/unocss-wind4')
    await convertProjectToJS(dir)
    const uno = readFileSync(join(dir, 'uno.config.js'), 'utf8')
    // object property that looks annotation-shaped must stay intact
    expect(uno).toMatch(/breakpoint:\s*breakpoints\.forUnoCSS/)
    // `import * as breakpoints` must not be mistaken for an `as` cast
    expect(uno).toMatch(/import \* as breakpoints from/)
  })
})
