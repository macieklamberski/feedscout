import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers user (guess, html), partly covers branch, commits, file, fileCommits, issues, repo.

export type GiteaUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string; branchPath?: string }

export type GiteaPage = GiteaUrl & { root: string }

const hosts = ['codeberg.org', 'www.codeberg.org', 'gitea.com', 'www.gitea.com']

const giteaCookieRegex = /(?:^|[;,\s])[\w-]*gitea=/
// suffixes: Gitea's own user routes, such as /{user}.rss, so no username ends with one
const userRouteSuffixRegex = /\.(?:atom|gpg|keys|png|rss)$/i
// suffixes: Gitea's own user and repo feeds, which Gitea also reserves on repo names
const activityFeedRegex = /.\.(?:atom|rss)$/i
// Gitea prints the window config as JSON, `"appSubUrl":"/gitea"`, and Forgejo as a script
// object with escaped slashes, `appSubUrl: '\/gitea'`.
const subUrlRegex = /appSubUrl["']?\s*:\s*["']([^"']*)["']/
const escapedSlashRegex = /\\\//g

const branchViews = ['src', 'commits']
const branchFeedRoutes = ['atom', 'rss']
const repoFeeds = [
  { files: ['releases.atom', 'releases.rss'], key: 'gitea:releases' },
  { files: ['tags.atom', 'tags.rss'], key: 'gitea:tags' },
]

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

    const { root } = page

    // User or organization page: codeberg.org/{owner}.
    if (page.kind === 'user') {
      const { owner } = page

      return [
        {
          uri: [`${root}/${owner}.atom`, `${root}/${owner}.rss`],
          hint: composeHint('gitea:activity'),
        },
      ]
    }

    // Repo page: codeberg.org/{owner}/{repo}.
    const { owner, repo, branchPath } = page
    const feeds: Array<DiscoverUriEntry> = [
      {
        uri: [`${root}/${owner}/${repo}/releases.atom`, `${root}/${owner}/${repo}/releases.rss`],
        hint: composeHint('gitea:releases'),
      },
      {
        uri: [`${root}/${owner}/${repo}/tags.atom`, `${root}/${owner}/${repo}/tags.rss`],
        hint: composeHint('gitea:tags'),
      },
      {
        uri: [`${root}/${owner}/${repo}.atom`, `${root}/${owner}/${repo}.rss`],
        hint: composeHint('gitea:activity'),
      },
    ]

    // Branch or file page and its history: {owner}/{repo}/{src|commits}/branch/{branch}/{path}.
    if (branchPath) {
      feeds.unshift({
        // gitea.com sends an anonymous /rss/branch request to its sign-in page, and Codeberg
        // answers /atom/branch with a cookie challenge.
        uri: [
          `${root}/${owner}/${repo}/atom/branch/${branchPath}`,
          `${root}/${owner}/${repo}/rss/branch/${branchPath}`,
        ],
        // A slashed branch, such as v11.0/forgejo, gets the file history label.
        hint: composeHint(branchPath.includes('/') ? 'gitea:file-history' : 'gitea:branch-commits'),
      })
    }

    return feeds
  },

  // Only Codeberg and gitea.com are claimed: a self-hosted instance is known by its session cookie,
  // which a feed URL does not carry.
  getFeedHint: (url) => {
    if (!isHostOf(url, hosts)) {
      return
    }

    const [ownerOrFeed, repoOrFeed, section, refType, ...refPath] = getPathSegments(url)

    // A user feed, /{owner}.atom, or a repo feed, /{owner}/{repo}.atom.
    if (!section) {
      if (activityFeedRegex.test(repoOrFeed ?? ownerOrFeed ?? '')) {
        return composeHint('gitea:activity')
      }

      return
    }

    if (!refType) {
      const repoFeed = repoFeeds.find(({ files }) => isAnyOf(section, files))

      if (!repoFeed) {
        return
      }

      return composeHint(repoFeed.key)
    }

    // A slashed branch, such as v11.0/forgejo, gets the file history label, as in resolve.
    if (isAnyOf(section, branchFeedRoutes) && isAnyOf(refType, 'branch') && refPath.length > 0) {
      return composeHint(refPath.length > 1 ? 'gitea:file-history' : 'gitea:branch-commits')
    }
  },
}
