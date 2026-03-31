import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

const numericPathRegex = /^\d+$/

const hosts = ['vimeo.com', 'www.vimeo.com']
const excludedPaths = [
  'about',
  'blog',
  'business',
  'careers',
  'categories',
  'channels',
  'create',
  'enterprise',
  'explore',
  'features',
  'for-hire',
  'groups',
  'help',
  'join',
  'log_in',
  'manage',
  'ondemand',
  'ott',
  'plus',
  'pricing',
  'pro',
  'search',
  'settings',
  'site_map',
  'solutions',
  'stock',
  'upload',
  'upgrade',
  'watch',
]

export const vimeoHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Channel page: vimeo.com/channels/{channel}
    if (pathSegments[0] === 'channels' && pathSegments[1]) {
      const channel = pathSegments[1]

      return [
        {
          uri: `${origin}/channels/${channel}/videos/rss`,
          hint: composeHint('vimeo:channel'),
        },
      ]
    }

    // Group page: vimeo.com/groups/{group}
    if (pathSegments[0] === 'groups' && pathSegments[1]) {
      const group = pathSegments[1]

      return [
        {
          uri: `${origin}/groups/${group}/videos/rss`,
          hint: composeHint('vimeo:group'),
        },
      ]
    }

    // User page: vimeo.com/{user}
    if (pathSegments.length > 0) {
      const user = pathSegments[0]

      // Skip excluded paths and numeric-only segments (video IDs).
      if (!isAnyOf(user, excludedPaths) && !numericPathRegex.test(user)) {
        const feeds = [{ uri: `${origin}/${user}/videos/rss`, hint: composeHint('vimeo:videos') }]

        if (pathSegments[1] === 'likes') {
          feeds.unshift({
            uri: `${origin}/${user}/likes/rss`,
            hint: composeHint('vimeo:likes'),
          })
        }

        return feeds
      }
    }

    return []
  },
}
