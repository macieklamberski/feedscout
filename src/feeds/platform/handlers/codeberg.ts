import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

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
        return [{ uri: `${origin}/${user}.rss`, hint: composeHint('codeberg:activity') }]
      }
    }

    // Repo page: codeberg.org/{user}/{repo}
    if (pathSegments.length >= 2) {
      const user = pathSegments[0]
      const repo = pathSegments[1]

      if (!isAnyOf(user, excludedPaths)) {
        const feeds = [
          {
            uri: `${origin}/${user}/${repo}/releases.rss`,
            hint: composeHint('codeberg:releases'),
          },
          {
            uri: `${origin}/${user}/${repo}/tags.rss`,
            hint: composeHint('codeberg:tags'),
          },
          {
            uri: `${origin}/${user}/${repo}.rss`,
            hint: composeHint('codeberg:activity'),
          },
        ]

        // Branch page: codeberg.org/{user}/{repo}/src/branch/{branch}
        if (pathSegments[2] === 'src' && pathSegments[3] === 'branch' && pathSegments[4]) {
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
