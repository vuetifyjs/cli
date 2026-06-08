import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createTarGzip } from 'nanotar'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadTemplate, extractSubdir, parseTemplateSource } from '../src/utils/downloadTemplate'

describe('parseTemplateSource', () => {
  it('parses a gh source with subdir and ref', () => {
    expect(parseTemplateSource('gh:vuetifyjs/cli/templates/vue/base#v1.2.0')).toEqual({
      repo: 'vuetifyjs/cli',
      subdir: 'templates/vue/base',
      ref: 'v1.2.0',
    })
  })

  it('accepts the github: prefix', () => {
    expect(parseTemplateSource('github:owner/repo/sub#main')).toEqual({
      repo: 'owner/repo',
      subdir: 'sub',
      ref: 'main',
    })
  })

  it('defaults the ref to main when omitted', () => {
    expect(parseTemplateSource('gh:owner/repo/sub')).toEqual({
      repo: 'owner/repo',
      subdir: 'sub',
      ref: 'main',
    })
  })

  it('strips a trailing slash from the subdir', () => {
    expect(parseTemplateSource('gh:owner/repo/sub/#dev').subdir).toBe('sub')
  })

  it('throws on an unsupported source', () => {
    expect(() => parseTemplateSource('https://example.com/x.tar.gz')).toThrow('Invalid template source')
  })
})

describe('extractSubdir', () => {
  const files = [
    { name: 'cli-main/', type: 'directory', size: 0 },
    { name: 'cli-main/templates/', type: 'directory', size: 0 },
    { name: 'cli-main/templates/vue/base/package.json', type: 'file', size: 2, data: new Uint8Array([1, 2]) },
    { name: 'cli-main/templates/vue/base/src/main.ts', type: 'file', size: 1, data: new Uint8Array([3]) },
    { name: 'cli-main/templates/nuxt/base/package.json', type: 'file', size: 1, data: new Uint8Array([4]) },
    { name: 'cli-main/README.md', type: 'file', size: 1, data: new Uint8Array([5]) },
  ] as any

  it('keeps only files under the subdir, relative to it', () => {
    expect(extractSubdir(files, 'templates/vue/base')).toEqual([
      { path: 'package.json', data: new Uint8Array([1, 2]) },
      { path: 'src/main.ts', data: new Uint8Array([3]) },
    ])
  })

  it('skips directories and entries without data', () => {
    const result = extractSubdir(files, 'templates')
    expect(result.map(e => e.path)).toEqual([
      'vue/base/package.json',
      'vue/base/src/main.ts',
      'nuxt/base/package.json',
    ])
  })
})

describe('downloadTemplate', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dl-tmpl-test-'))
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(dir, { recursive: true, force: true })
  })

  async function mockFetchWithTarball () {
    const tarball = await createTarGzip([
      { name: 'cli-main/templates/vue/base/package.json', data: '{"name":"x"}' },
      { name: 'cli-main/templates/vue/base/src/main.ts', data: 'export const a = 1' },
      { name: 'cli-main/templates/nuxt/base/nuxt.config.ts', data: 'export default {}' },
      { name: 'cli-main/README.md', data: '# repo' },
    ])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(tarball as any, { status: 200 })))
  }

  it('downloads and extracts only the requested subdir', async () => {
    await mockFetchWithTarball()

    const target = join(dir, 'out')
    await downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir: target })

    expect((await readFile(join(target, 'package.json'), 'utf8'))).toBe('{"name":"x"}')
    expect((await readFile(join(target, 'src/main.ts'), 'utf8'))).toBe('export const a = 1')
    // files outside the subdir are not written
    const names = await readdir(target)
    expect(names.toSorted()).toEqual(['package.json', 'src'])
  })

  it('requests the github archive tarball for the ref', async () => {
    await mockFetchWithTarball()
    await downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir: join(dir, 'out') })
    expect(fetch).toHaveBeenCalledWith('https://github.com/vuetifyjs/cli/archive/v1.0.0.tar.gz')
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404, statusText: 'Not Found' })))
    await expect(
      downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir: join(dir, 'out') }),
    ).rejects.toThrow('404')
  })

  it('throws when the subdir yields no files', async () => {
    await mockFetchWithTarball()
    await expect(
      downloadTemplate('gh:vuetifyjs/cli/templates/does/not-exist#v1.0.0', { dir: join(dir, 'out') }),
    ).rejects.toThrow('No files found')
  })

  it('refuses a non-empty target without force', async () => {
    await mockFetchWithTarball()
    await downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir })
    await expect(
      downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir }),
    ).rejects.toThrow('already exists')
  })

  it('allows a non-empty target with force', async () => {
    await mockFetchWithTarball()
    await downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir })
    await expect(
      downloadTemplate('gh:vuetifyjs/cli/templates/vue/base#v1.0.0', { dir, force: true }),
    ).resolves.toMatchObject({ dir })
  })
})
