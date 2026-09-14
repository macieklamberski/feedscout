import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers user (html, guess), partly covers issues, repo.
// Handler needed for: branch.

export const hosts = ['codeberg.org', 'www.codeberg.org', 'gitea.com', 'www.gitea.com']
const giteaCookieRegex = /(?:^|[;,\s])[\w-]*gitea=/
export const excludedPaths = [
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

export const isGiteaHeaders = (headers: Headers): boolean => {
  return giteaCookieRegex.test(headers.get('set-cookie') ?? '')
}

// `resolve` returns nothing without a usable first segment, so `match` tests the
// same thing rather than claiming a page it cannot serve.
export const hasResolvablePath = (url: string): boolean => {
  const [first] = getPathSegments(url)

  return Boolean(first) && !isAnyOf(first, excludedPaths)
}

export const giteaHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    if (!hasResolvablePath(url)) {
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
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // User/org page: codeberg.org/{user}
    if (pathSegments.length === 1) {
      const user = pathSegments[0]

      if (!isAnyOf(user, excludedPaths)) {
        return [
          {
            uri: [`${origin}/${user}.atom`, `${origin}/${user}.rss`],
            hint: composeHint('gitea:activity'),
          },
        ]
      }
    }

    // Repo page: codeberg.org/{user}/{repo}
    if (pathSegments.length >= 2) {
      const user = pathSegments[0]
      const repo = pathSegments[1]

      if (!isAnyOf(user, excludedPaths)) {
        const feeds: Array<DiscoverUriEntry> = [
          {
            uri: [
              `${origin}/${user}/${repo}/releases.atom`,
              `${origin}/${user}/${repo}/releases.rss`,
            ],
            hint: composeHint('gitea:releases'),
          },
          {
            uri: [`${origin}/${user}/${repo}/tags.atom`, `${origin}/${user}/${repo}/tags.rss`],
            hint: composeHint('gitea:tags'),
          },
          {
            uri: [`${origin}/${user}/${repo}.atom`, `${origin}/${user}/${repo}.rss`],
            hint: composeHint('gitea:activity'),
          },
        ]

        return feeds
      }
    }

    return []
  },
}
