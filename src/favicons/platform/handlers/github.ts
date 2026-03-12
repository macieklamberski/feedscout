import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['github.com', 'www.github.com']

const excludedPaths = new Set([
  'about',
  'codespaces',
  'collections',
  'contact',
  'copilot',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'join',
  'login',
  'marketplace',
  'notifications',
  'pricing',
  'pulls',
  'search',
  'security',
  'settings',
  'signup',
  'sponsors',
  'topics',
  'trending',
])

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return []
    }

    const user = segments[0]

    if (excludedPaths.has(user.toLowerCase())) {
      return []
    }

    return [{ uri: `https://github.com/${user}.png` }]
  },
}
