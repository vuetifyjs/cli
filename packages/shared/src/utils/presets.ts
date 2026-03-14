import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import slugify from '@sindresorhus/slugify'
import { join, resolve } from 'pathe'
import { standardPresets } from '../constants/presets'

export interface UserPresetEntry {
  file: string
  path: string
  invalid: boolean
  slug: string
  displayName: string
  preset?: any
}

export function getCreatePresetsDir () {
  const home = homedir()
  return join(home, '.vuetify', 'create', 'presets')
}

export function listUserPresets (): UserPresetEntry[] {
  const presetsDir = getCreatePresetsDir()
  const files = existsSync(presetsDir) ? readdirSync(presetsDir).filter(f => f.endsWith('.json')) : []

  const entries: UserPresetEntry[] = []
  for (const file of files) {
    const path = join(presetsDir, file)
    const slug = file.replace(/\.json$/, '')

    try {
      const content = readFileSync(path, 'utf8')
      const preset = JSON.parse(content)
      const displayName = preset.meta?.displayName || slug

      entries.push({
        file,
        path,
        invalid: false,
        slug,
        displayName,
        preset,
      })
    } catch {
      entries.push({
        file,
        path,
        invalid: true,
        slug,
        displayName: slug,
      })
    }
  }

  return entries
}

export function resolvePresetPath (input: string): string | undefined {
  const presetPath = resolve(input)
  if (existsSync(presetPath)) {
    return presetPath
  }

  const home = homedir()
  const presetName = input.endsWith('.json') ? input : `${input}.json`

  const createPresetsDir = join(home, '.vuetify', 'create', 'presets')
  const createPresetPath = join(createPresetsDir, presetName)
  if (existsSync(createPresetPath)) {
    return createPresetPath
  }

  const slug = slugify(input)
  const createSlugPath = join(createPresetsDir, `${slug}.json`)
  if (existsSync(createSlugPath)) {
    return createSlugPath
  }

  const legacyPresetsDir = join(home, '.vuetify', 'presets')
  const legacyPresetPath = join(legacyPresetsDir, presetName)
  if (existsSync(legacyPresetPath)) {
    return legacyPresetPath
  }

  const legacySlugPath = join(legacyPresetsDir, `${slug}.json`)
  if (existsSync(legacySlugPath)) {
    return legacySlugPath
  }
}

export function loadPreset (input: string): any | undefined {
  if (standardPresets[input]) {
    return standardPresets[input]
  }

  const path = resolvePresetPath(input)
  if (!path) {
    return
  }

  try {
    const content = readFileSync(path, 'utf8')
    return JSON.parse(content)
  } catch {
    return
  }
}

