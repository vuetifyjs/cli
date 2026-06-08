import type { ParsedTarFileItem } from 'nanotar'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { parseTarGzip } from 'nanotar'
import { dirname, join } from 'pathe'

export interface DownloadTemplateOptions {
  /** Directory to extract the template into. */
  dir: string
  /** Allow extracting into a directory that already contains files. */
  force?: boolean
}

export interface ParsedTemplateSource {
  /** `owner/repo` */
  repo: string
  /** Subdirectory within the repo, without trailing slash. */
  subdir: string
  /** Branch, tag or commit. */
  ref: string
}

// gh:owner/repo/sub/dir#ref  (also accepts the `github:` prefix)
const RE_SOURCE = /^(?:gh|github):([^/\s]+\/[^/#\s]+)(?:\/([^#]*))?(?:#(.+))?$/
const RE_TRAILING_SLASH = /\/+$/
const RE_TOP_DIR = /^[^/]+\//

export function parseTemplateSource (source: string): ParsedTemplateSource {
  const match = RE_SOURCE.exec(source)
  if (!match) {
    throw new Error(`Invalid template source: ${source}`)
  }
  return {
    repo: match[1],
    subdir: (match[2] ?? '').replace(RE_TRAILING_SLASH, ''),
    ref: match[3] || 'main',
  }
}

/**
 * Filters parsed tarball entries down to the files under `subdir`, stripping the
 * GitHub-injected top-level `<repo>-<ref>/` folder and the subdir prefix so the
 * returned paths are relative to the template root.
 */
export function extractSubdir (files: ParsedTarFileItem[], subdir: string) {
  const prefix = subdir ? `${subdir}/` : ''
  const entries: { path: string, data: Uint8Array }[] = []
  for (const file of files) {
    if (file.type !== 'file' || !file.data) {
      continue
    }
    const rel = file.name.replace(RE_TOP_DIR, '')
    if (!rel.startsWith(prefix)) {
      continue
    }
    entries.push({ path: rel.slice(prefix.length), data: file.data })
  }
  return entries
}

/**
 * Minimal replacement for giget's `downloadTemplate`, scoped to the only thing we
 * use it for: fetching a public GitHub subdirectory at a given ref and extracting
 * it to disk. Avoids pulling giget's tar/nypm/citty bundle into the CLI.
 */
export async function downloadTemplate (source: string, options: DownloadTemplateOptions) {
  const { dir, force } = options

  if (!force && existsSync(dir) && readdirSync(dir).length > 0) {
    throw new Error(`Directory already exists and is not empty: ${dir}`)
  }

  const { repo, subdir, ref } = parseTemplateSource(source)
  const url = `https://github.com/${repo}/archive/${ref}.tar.gz`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${source} (${response.status} ${response.statusText})`)
  }

  const files = await parseTarGzip(new Uint8Array(await response.arrayBuffer()))
  const entries = extractSubdir(files, subdir)
  if (entries.length === 0) {
    throw new Error(`No files found for ${source}`)
  }

  await mkdir(dir, { recursive: true })
  for (const entry of entries) {
    const target = join(dir, entry.path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, entry.data)
  }

  return { dir }
}
