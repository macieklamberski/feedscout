import { gitea } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getSiteParams, getSiteUrl } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: activity.
// Handler needed for: branch-commits, file-history, releases, tags.

export type GiteaUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string; branchPath?: string }

export type GiteaPage = GiteaUrl & { root: string }

const giteaCookieRegex = /(?:^|[;,\s])[\w-]*gitea=/
// Gitea prints the window config as JSON, `"appSubUrl":"/gitea"`, and Forgejo as a script
// object with escaped slashes, `appSubUrl: '\/gitea'`.
const subUrlRegex = /appSubUrl["']?\s*:\s*["']([^"']*)["']/
const escapedSlashRegex = /\\\//g

const feeds = withHintLabels(gitea.feeds)

export const isGiteaHeaders = (headers: Headers): boolean => {
  return giteaCookieRegex.test(headers.get('set-cookie') ?? '')
}

const readGiteaUrl = (url: string, base: string): GiteaPage | undefined => {
  const page = gitea.pages.read(url, { base })

  if (!page) {
    return
  }

  const { owner } = page.params
  const root = getSiteUrl(page.params)

  if (page.key === 'user') {
    return { kind: 'user', owner, root }
  }

  const { repo, branchPath } = page.params

  if (branchPath) {
    return { kind: 'repo', owner, repo, branchPath: branchPath.join('/'), root }
  }

  return { kind: 'repo', owner, repo, root }
}

export const parseGiteaUrl = (url: string): GiteaUrl | undefined => {
  const page = readGiteaUrl(url, '')

  if (!page) {
    return
  }

  const { root, ...parsed } = page

  return parsed
}

// An install under a sub-path names it in the window config, and the owner is the segment after it.
export const getGiteaPage = (url: string, content: string | undefined): GiteaPage | undefined => {
  const subPath = content?.match(subUrlRegex)?.[1]?.replace(escapedSlashRegex, '/') ?? ''

  return readGiteaUrl(url, subPath)
}

export const giteaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!getGiteaPage(url, content)) {
      return false
    }

    if (gitea.pages.read(url)) {
      return true
    }

    if (headers && isGiteaHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url, content) => {
    const page = getGiteaPage(url, content)

    if (!page) {
      return []
    }

    const { root, owner } = page
    const site = getSiteParams(root)

    // User or organization page: codeberg.org/{owner}.
    if (page.kind === 'user') {
      return [
        feeds.getFeedEntry('activity', { ...site, owner }, 'atom'),
        feeds.getFeedEntry('activity', { ...site, owner }, 'rss'),
      ]
    }

    // Repo page: codeberg.org/{owner}/{repo}.
    const { repo, branchPath } = page

    if (!branchPath) {
      return [
        feeds.getFeedEntry('releases', { ...site, owner, repo }, 'atom'),
        feeds.getFeedEntry('releases', { ...site, owner, repo }, 'rss'),
        feeds.getFeedEntry('tags', { ...site, owner, repo }, 'atom'),
        feeds.getFeedEntry('tags', { ...site, owner, repo }, 'rss'),
        feeds.getFeedEntry('activity', { ...site, owner, repo }, 'atom'),
        feeds.getFeedEntry('activity', { ...site, owner, repo }, 'rss'),
      ]
    }

    // Branch or file page and its history: {owner}/{repo}/{src|commits}/branch/{branch}/{path}.
    // gitea.com sends an anonymous /rss/branch request to its sign-in page, and Codeberg answers
    // /atom/branch with a cookie challenge, so both are emitted.
    if (branchPath.includes('/')) {
      return [
        feeds.getFeedEntry('file-history', { ...site, owner, repo, path: branchPath }, 'atom'),
        feeds.getFeedEntry('file-history', { ...site, owner, repo, path: branchPath }, 'rss'),
        feeds.getFeedEntry('releases', { ...site, owner, repo }, 'atom'),
        feeds.getFeedEntry('releases', { ...site, owner, repo }, 'rss'),
        feeds.getFeedEntry('tags', { ...site, owner, repo }, 'atom'),
        feeds.getFeedEntry('tags', { ...site, owner, repo }, 'rss'),
        feeds.getFeedEntry('activity', { ...site, owner, repo }, 'atom'),
        feeds.getFeedEntry('activity', { ...site, owner, repo }, 'rss'),
      ]
    }

    return [
      feeds.getFeedEntry('branch-commits', { ...site, owner, repo, branch: branchPath }, 'atom'),
      feeds.getFeedEntry('branch-commits', { ...site, owner, repo, branch: branchPath }, 'rss'),
      feeds.getFeedEntry('releases', { ...site, owner, repo }, 'atom'),
      feeds.getFeedEntry('releases', { ...site, owner, repo }, 'rss'),
      feeds.getFeedEntry('tags', { ...site, owner, repo }, 'atom'),
      feeds.getFeedEntry('tags', { ...site, owner, repo }, 'rss'),
      feeds.getFeedEntry('activity', { ...site, owner, repo }, 'atom'),
      feeds.getFeedEntry('activity', { ...site, owner, repo }, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
