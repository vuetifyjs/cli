import { i18n } from '../i18n'

export interface ReleaseNotes {
  tag: string
  name: string
  publishedAt: string
  url: string
  body: string
}

interface GitHubRelease {
  tag_name: string
  name: string | null
  published_at: string
  html_url: string
  body: string | null
}

const REPOS: Record<string, string> = {
  vuetify: 'vuetifyjs/vuetify',
  v0: 'vuetifyjs/0',
  vuetify0: 'vuetifyjs/0',
  0: 'vuetifyjs/0',
}

// vuetifyjs/0 interleaves core tags (v1.0.0-beta.4) with Paper package tags
// (@paper/genesis@1.0.0-beta.3); only tags starting with `v<digit>` are core.
const RE_CORE_TAG = /^v\d/

function resolveRepo (pkg: string) {
  return REPOS[pkg.toLowerCase()]
}

function normalizeTag (version: string) {
  return version.startsWith('v') ? version : `v${version}`
}

function headers () {
  const result: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'vuetify-cli',
  }
  if (process.env.GITHUB_TOKEN) {
    result.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return result
}

function assertOk (response: Response, tag: string) {
  if (response.ok) {
    return
  }
  if (response.status === 404) {
    throw new Error(i18n.t('commands.releaseNotes.not_found', { tag }))
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error(i18n.t('commands.releaseNotes.rate_limited'))
  }
  throw new Error(i18n.t('commands.releaseNotes.failed', { status: `${response.status} ${response.statusText}` }))
}

async function fetchByTag (repo: string, tag: string): Promise<GitHubRelease> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`, { headers: headers() })
  assertOk(response, tag)
  return await response.json() as GitHubRelease
}

async function fetchLatest (repo: string): Promise<GitHubRelease> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: headers() })
  assertOk(response, 'latest')
  return await response.json() as GitHubRelease
}

async function fetchLatestCore (repo: string): Promise<GitHubRelease> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, { headers: headers() })
  assertOk(response, 'latest')
  const releases = await response.json() as GitHubRelease[]
  const release = releases.find(item => RE_CORE_TAG.test(item.tag_name))
  if (!release) {
    throw new Error(i18n.t('commands.releaseNotes.none_found'))
  }
  return release
}

export async function fetchReleaseNotes (pkg: string, version: string): Promise<ReleaseNotes> {
  const repo = resolveRepo(pkg)
  if (!repo) {
    throw new Error(i18n.t('commands.releaseNotes.unknown_package', { package: pkg }))
  }

  const isLatest = !version || version === 'latest'
  let release: GitHubRelease

  if (isLatest) {
    // vuetifyjs/0 ships only prereleases, so releases/latest returns nothing usable.
    release = repo === 'vuetifyjs/0' ? await fetchLatestCore(repo) : await fetchLatest(repo)
  } else {
    release = await fetchByTag(repo, normalizeTag(version))
  }

  return {
    tag: release.tag_name,
    name: release.name || release.tag_name,
    publishedAt: release.published_at,
    url: release.html_url,
    body: release.body || '',
  }
}
