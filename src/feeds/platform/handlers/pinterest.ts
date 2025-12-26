import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

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

    // Board page: /{username}/{boardname}
    if (pathSegments.length >= 2) {
      const boardname = pathSegments[1]

      // Skip special paths like /pins, /boards, /_saved, etc.
      if (boardname.startsWith('_') || boardname === 'pins' || boardname === 'boards') {
        return [`https://www.pinterest.com/${username}/feed.rss`]
      }

      return [`https://www.pinterest.com/${username}/${boardname}.rss`]
    }

    // User profile: /{username}
    return [`https://www.pinterest.com/${username}/feed.rss`]
  },
}
