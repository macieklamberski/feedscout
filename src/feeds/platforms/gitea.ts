import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers user (guess, html), partly covers branch, commits, file, fileCommits, issues, repo.

export type GiteaUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string; branchPath?: string }

const hosts = ['codeberg.org', 'www.codeberg.org', 'gitea.com', 'www.gitea.com']
const giteaCookieRegex = /(?:^|[;,\s])[\w-]*gitea=/
// Gitea reserves these suffixes for routes of a user, such as /{user}.rss, so no username ends
// with one.
const userRouteSuffixRegex = /\.(?:atom|gpg|keys|png|rss)$/i
const excludedPaths = [
  'explore',
  'admin',
  'user',
  'assets',
  'api',
  'swagger.json',
  'robots.txt',
  'sitemap.xml',
  '-',
]
const branchViews = ['src', 'commits']

export const isGiteaHeaders = (headers: Headers): boolean => {
  return giteaCookieRegex.test(headers.get('set-cookie') ?? '')
}

export const parseGiteaUrl = (url: string): GiteaUrl | undefined => {
  const [first, repo, section, refType, ...refPath] = getPathSegments(url)
  const owner = repo ? first : first?.replace(userRouteSuffixRegex, '')

  if (!owner || isAnyOf(owner, excludedPaths)) {
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

export const giteaHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    if (!parseGiteaUrl(url)) {
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

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseGiteaUrl(url)

    if (!parsed) {
      return []
    }

    // User or organization page: codeberg.org/{owner}.
    if (parsed.kind === 'user') {
      const { owner } = parsed

      return [
        {
          uri: [`${origin}/${owner}.atom`, `${origin}/${owner}.rss`],
          hint: composeHint('gitea:activity'),
        },
      ]
    }

    // Repo page: codeberg.org/{owner}/{repo}.
    const { owner, repo, branchPath } = parsed
    const feeds: Array<DiscoverUriEntry> = [
      {
        uri: [
          `${origin}/${owner}/${repo}/releases.atom`,
          `${origin}/${owner}/${repo}/releases.rss`,
        ],
        hint: composeHint('gitea:releases'),
      },
      {
        uri: [`${origin}/${owner}/${repo}/tags.atom`, `${origin}/${owner}/${repo}/tags.rss`],
        hint: composeHint('gitea:tags'),
      },
      {
        uri: [`${origin}/${owner}/${repo}.atom`, `${origin}/${owner}/${repo}.rss`],
        hint: composeHint('gitea:activity'),
      },
    ]

    // Branch or file page and its history: {owner}/{repo}/{src|commits}/branch/{branch}/{path}.
    if (branchPath) {
      feeds.unshift({
        // gitea.com sends an anonymous /rss/branch request to its sign-in page, and Codeberg
        // answers /atom/branch with a cookie challenge.
        uri: [
          `${origin}/${owner}/${repo}/atom/branch/${branchPath}`,
          `${origin}/${owner}/${repo}/rss/branch/${branchPath}`,
        ],
        // A slashed branch, such as v11.0/forgejo, gets the file history label.
        hint: composeHint(branchPath.includes('/') ? 'gitea:file-history' : 'gitea:branch-commits'),
      })
    }

    return feeds
  },
}
