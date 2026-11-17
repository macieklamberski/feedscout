import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: activity.
// Handler needed for: branch-commits, file-history, releases, tags.

export type GiteaUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string; branchPath?: string }

export type GiteaPage = GiteaUrl & { root: string }

const hosts = ['codeberg.org', 'www.codeberg.org', 'gitea.com', 'www.gitea.com']

const giteaCookieRegex = /(?:^|[;,\s])[\w-]*gitea=/
// suffixes: Gitea's own user routes, such as /{user}.rss, so no username ends with one
const userRouteSuffixRegex = /\.(?:atom|gpg|keys|png|rss)$/i
// Gitea prints the window config as JSON, `"appSubUrl":"/gitea"`, and Forgejo as a script
// object with escaped slashes, `appSubUrl: '\/gitea'`.
const subUrlRegex = /appSubUrl["']?\s*:\s*["']([^"']*)["']/
const escapedSlashRegex = /\\\//g

const branchViews = ['src', 'commits']

// Every feed comes as Atom and RSS, emitted as two entries, so validation keeps the one a host
// serves. The table claims a feed only on Codeberg and gitea.com: a self-hosted instance is known
// by its session cookie, which a feed URL does not carry. A slashed branch, such as v11.0/forgejo,
// reads as the file history, so the one-segment rows come first, and a repo's activity comes
// before its owner's, so a page with a repo builds the repo's.
const feeds = definePlatformFeeds(
  [
    { key: 'gitea:activity', main: '{root}/{owner}/{repo}.atom', format: 'atom' },
    { key: 'gitea:activity', main: '{root}/{owner}/{repo}.rss', format: 'rss' },
    { key: 'gitea:activity', main: '{root}/{owner}.atom', format: 'atom' },
    { key: 'gitea:activity', main: '{root}/{owner}.rss', format: 'rss' },
    { key: 'gitea:releases', main: '{root}/{owner}/{repo}/releases.atom', format: 'atom' },
    { key: 'gitea:releases', main: '{root}/{owner}/{repo}/releases.rss', format: 'rss' },
    { key: 'gitea:tags', main: '{root}/{owner}/{repo}/tags.atom', format: 'atom' },
    { key: 'gitea:tags', main: '{root}/{owner}/{repo}/tags.rss', format: 'rss' },
    {
      key: 'gitea:branch-commits',
      main: '{root}/{owner}/{repo}/atom/branch/{branch}',
      format: 'atom',
    },
    {
      key: 'gitea:branch-commits',
      main: '{root}/{owner}/{repo}/rss/branch/{branch}',
      format: 'rss',
    },
    {
      key: 'gitea:file-history',
      main: '{root}/{owner}/{repo}/atom/branch/{path*}',
      format: 'atom',
    },
    { key: 'gitea:file-history', main: '{root}/{owner}/{repo}/rss/branch/{path*}', format: 'rss' },
  ],
  { hosts: { exact: hosts } },
)

export const isGiteaHeaders = (headers: Headers): boolean => {
  return giteaCookieRegex.test(headers.get('set-cookie') ?? '')
}

export const parseGiteaUrl = (url: string): GiteaUrl | undefined => {
  const [first, repo, section, refType, ...refPath] = getPathSegments(url)
  const owner = repo ? first : first?.replace(userRouteSuffixRegex, '')

  if (!owner) {
    return
  }

  // A branch name can contain a slash, as in v11.0/forgejo, and only Gitea knows where it ends,
  // so splitting the branch from the file path here breaks the feed URL.
  if (repo && isAnyOf(section, branchViews) && isAnyOf(refType, 'branch') && refPath.length > 0) {
    return { kind: 'repo', owner, repo, branchPath: refPath.join('/') }
  }

  if (repo) {
    return { kind: 'repo', owner, repo }
  }

  return { kind: 'user', owner }
}

// An install under a sub-path names it in the window config, and the owner is the segment after it.
export const getGiteaPage = (url: string, content: string | undefined): GiteaPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const subPath = content?.match(subUrlRegex)?.[1]?.replace(escapedSlashRegex, '/') ?? ''

  if (!parsedUrl.pathname.startsWith(`${subPath}/`)) {
    return
  }

  const parsed = parseGiteaUrl(`${parsedUrl.origin}${parsedUrl.pathname.slice(subPath.length)}`)

  if (!parsed) {
    return
  }

  return { ...parsed, root: `${parsedUrl.origin}${subPath}` }
}

export const giteaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!getGiteaPage(url, content)) {
      return false
    }

    if (isHostOf(url, hosts)) {
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

    // User or organization page: codeberg.org/{owner}.
    if (page.kind === 'user') {
      return [
        feeds.getFeedEntry('gitea:activity', { root, owner }, 'atom'),
        feeds.getFeedEntry('gitea:activity', { root, owner }, 'rss'),
      ]
    }

    // Repo page: codeberg.org/{owner}/{repo}.
    const { repo, branchPath } = page

    if (!branchPath) {
      return [
        feeds.getFeedEntry('gitea:releases', { root, owner, repo }, 'atom'),
        feeds.getFeedEntry('gitea:releases', { root, owner, repo }, 'rss'),
        feeds.getFeedEntry('gitea:tags', { root, owner, repo }, 'atom'),
        feeds.getFeedEntry('gitea:tags', { root, owner, repo }, 'rss'),
        feeds.getFeedEntry('gitea:activity', { root, owner, repo }, 'atom'),
        feeds.getFeedEntry('gitea:activity', { root, owner, repo }, 'rss'),
      ]
    }

    // Branch or file page and its history: {owner}/{repo}/{src|commits}/branch/{branch}/{path}.
    // gitea.com sends an anonymous /rss/branch request to its sign-in page, and Codeberg answers
    // /atom/branch with a cookie challenge, so both are emitted.
    if (branchPath.includes('/')) {
      return [
        feeds.getFeedEntry('gitea:file-history', { root, owner, repo, path: branchPath }, 'atom'),
        feeds.getFeedEntry('gitea:file-history', { root, owner, repo, path: branchPath }, 'rss'),
        feeds.getFeedEntry('gitea:releases', { root, owner, repo }, 'atom'),
        feeds.getFeedEntry('gitea:releases', { root, owner, repo }, 'rss'),
        feeds.getFeedEntry('gitea:tags', { root, owner, repo }, 'atom'),
        feeds.getFeedEntry('gitea:tags', { root, owner, repo }, 'rss'),
        feeds.getFeedEntry('gitea:activity', { root, owner, repo }, 'atom'),
        feeds.getFeedEntry('gitea:activity', { root, owner, repo }, 'rss'),
      ]
    }

    return [
      feeds.getFeedEntry('gitea:branch-commits', { root, owner, repo, branch: branchPath }, 'atom'),
      feeds.getFeedEntry('gitea:branch-commits', { root, owner, repo, branch: branchPath }, 'rss'),
      feeds.getFeedEntry('gitea:releases', { root, owner, repo }, 'atom'),
      feeds.getFeedEntry('gitea:releases', { root, owner, repo }, 'rss'),
      feeds.getFeedEntry('gitea:tags', { root, owner, repo }, 'atom'),
      feeds.getFeedEntry('gitea:tags', { root, owner, repo }, 'rss'),
      feeds.getFeedEntry('gitea:activity', { root, owner, repo }, 'atom'),
      feeds.getFeedEntry('gitea:activity', { root, owner, repo }, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
