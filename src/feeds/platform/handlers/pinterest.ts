import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Not discoverable without handler.

const hosts = ['pinterest.com', 'www.pinterest.com', 'pin.it']
const excludedPaths = [
  '_',
  'about',
  'business',
  'convert',
  'explore',
  'ideas',
  'login',
  'news_hub',
  'password',
  'pin',
  'privacy',
  'resource',
  'search',
  'settings',
  'terms',
  'today',
  'topics',
]

export const pinterestHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Need at least a username.
    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://www.pinterest.com/${username}/feed.rss`,
        hint: composeHint('pinterest:pins'),
      },
    ]
  },
}
