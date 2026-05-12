import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Codeberg (Forgejo) and gitea.com expose Atom and RSS for user/org activity
// at `/{user}.atom|.rss` and repo activity at `/{user}/{repo}.atom|.rss`,
// plus per-repo releases at `/{user}/{repo}/releases.atom|.rss` and tags at
// `/{user}/{repo}/tags.atom|.rss`. The repo page advertises only the repo
// activity feed via `<link rel="alternate">`; releases, tags, and per-branch
// commit feeds are not autodiscovered.
// The handler enumerates all four per-repo feeds and adds Gitea-only
// `/rss/branch/{branch}` commit and file-history feeds (Forgejo removed them).

export const hosts = ['codeberg.org', 'www.codeberg.org', 'gitea.com', 'www.gitea.com']
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

export const codebergHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
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
            hint: composeHint('codeberg:activity'),
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
            hint: composeHint('codeberg:releases'),
          },
          {
            uri: [`${origin}/${user}/${repo}/tags.atom`, `${origin}/${user}/${repo}/tags.rss`],
            hint: composeHint('codeberg:tags'),
          },
          {
            uri: [`${origin}/${user}/${repo}.atom`, `${origin}/${user}/${repo}.rss`],
            hint: composeHint('codeberg:activity'),
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
            hint: composeHint(filePath ? 'codeberg:file-history' : 'codeberg:branch-commits'),
          })
        }

        return feeds
      }
    }

    return []
  },
}
