import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Gitea and its Forgejo fork expose Atom and RSS for user/org activity
// at `/{user}.atom|.rss` and repo activity at `/{user}/{repo}.atom|.rss`,
// plus per-repo releases at `/{user}/{repo}/releases.atom|.rss` and tags at
// `/{user}/{repo}/tags.atom|.rss`. The repo page advertises only the repo
// activity feed via `<link rel="alternate">`; releases, tags, and per-branch
// commit feeds are not autodiscovered.
// The handler enumerates all four per-repo feeds and adds Gitea-only
// `/rss/branch/{branch}` commit and file-history feeds (Forgejo removed them).
//
// A self-hosted instance is matched by the session cookie Gitea sets on any page
// carrying a CSRF token, so a repo page has it and the instance root does not.
// The name is `i_like_gitea` by default and operators rename it by prefix, so
// any cookie name ending in `gitea` counts: opendev.org serves the default and
// git.fsfe.org serves `fsfe-gitea`. Forgejo sets no cookie anonymously, so
// self-hosted Forgejo stays unmatched and the host list is what covers Codeberg.

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
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  return Boolean(first) && !isAnyOf(first, excludedPaths)
}

export const giteaHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    try {
      if (!hasResolvablePath(url)) {
        return false
      }

      if (isHostOf(url, hosts)) {
        return true
      }

      if (headers && isGiteaHeaders(headers)) {
        return true
      }
    } catch {}

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

        // Branch page: codeberg.org/{user}/{repo}/src/branch/{branch}
        // Gitea still serves /rss/branch/{branch} but Forgejo (Codeberg's runtime)
        // removed it — so gate this emission on Gitea hosts only.
        if (
          isHostOf(url, ['gitea.com', 'www.gitea.com']) &&
          pathSegments[2] === 'src' &&
          pathSegments[3] === 'branch' &&
          pathSegments[4]
        ) {
          const branch = pathSegments[4]
          const filePath = pathSegments.slice(5).join('/')

          feeds.unshift({
            uri: `${origin}/${user}/${repo}/rss/branch/${branch}${filePath ? `/${filePath}` : ''}`,
            hint: composeHint(filePath ? 'gitea:file-history' : 'gitea:branch-commits'),
          })
        }

        return feeds
      }
    }

    return []
  },
}
