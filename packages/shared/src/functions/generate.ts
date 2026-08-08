import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'pathe'
import { loadInventory, recordComponent } from './inventory'

export interface GenerateOptions {
  name: string
  cwd?: string
  dir?: string
  overwrite?: boolean
}

function toPascal (value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]!.toUpperCase() + part.slice(1))
    .join('')
}

function scaffold (name: string): string {
  // Bare markup — no utility classes; the host project may not use Uno/Tailwind.
  return `<script setup lang="ts">
  // ${name} — generated local component (not from a registry)
</script>

<template>
  <div>
    <slot />
  </div>
</template>
`
}

/**
 * Scaffold a local component into the project inventory with no upstream origin.
 */
export async function generateComponent (options: GenerateOptions) {
  const cwd = options.cwd ?? process.cwd()
  const inventory = await loadInventory(cwd)
  const base = options.dir ?? inventory.aliases.components
  const pascal = toPascal(options.name)
  if (!pascal) {
    throw new Error('Component name is empty')
  }

  const file = `${pascal}.vue`
  const dir = base
  const abs = join(cwd, dir, file)

  if (existsSync(abs) && !options.overwrite) {
    throw new Error(`${relative(cwd, abs)} already exists (pass --overwrite)`)
  }

  await mkdir(join(cwd, dir), { recursive: true })
  await writeFile(abs, scaffold(pascal))

  await recordComponent({
    cwd,
    name: pascal,
    dir,
    files: [file],
    entry: file,
    title: pascal,
    // Only seed/update the project components alias when writing to the
    // inventory default — an explicit --dir is one-shot and must not move
    // later `add` / `refresh` destinations (e.g. into src/components/ui).
    componentsDir: options.dir ? undefined : base,
  })

  return { path: relative(cwd, abs).split('\\').join('/'), name: pascal }
}
