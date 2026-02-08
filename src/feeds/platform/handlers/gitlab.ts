import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['gitlab.com', 'www.gitlab.com']
const excludedPaths = [
  'explore',
  'dashboard',
  'projects',
  'groups',
  'search',
  'admin',
  'help',
  'assets',
  'users',
  'api',
  'jwt',
  'oauth',
  'profile',
  'snippets',
  'abuse_reports',
  'invites',
  'import',
  'uploads',
  'robots.txt',
  'sitemap',
  '-',
]

export const gitlabHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // User/org page: gitlab.com/{user}
    if (pathSegments.length === 1) {
      const user = pathSegments[0]

      if (!isAnyOf(user, excludedPaths)) {
        return [
          { uri: `${origin}/${user}.atom`, hint: { key: 'gitlab:activity', label: 'Activity' } },
        ]
      }
    }

    // Repo page: gitlab.com/{user}/{repo}
    if (pathSegments.length >= 2) {
      const user = pathSegments[0]
      const repo = pathSegments[1]

      if (!isAnyOf(user, excludedPaths)) {
        return [
          {
            uri: `${origin}/${user}/${repo}/-/releases.atom`,
            hint: { key: 'gitlab:releases', label: 'Releases' },
          },
          {
            uri: `${origin}/${user}/${repo}/-/tags?format=atom`,
            hint: { key: 'gitlab:tags', label: 'Tags' },
          },
          {
            uri: `${origin}/${user}/${repo}.atom`,
            hint: { key: 'gitlab:activity', label: 'Activity' },
          },
        ]
      }
    }

    return []
  },
}
