import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

const numericRegex = /^\d+$/

const hosts = ['vimeo.com', 'www.vimeo.com']
const excludedPaths = [
  'about',
  'album',
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
  'showcase',
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

    // Album/showcase: vimeo.com/album/{id} or vimeo.com/showcase/{id}. Only /album/{id}/rss
    // returns RSS; /showcase/{id}/rss returns 404. /album/{id} 301-redirects to
    // /showcase/{id} in the browser, so users will most often paste the showcase URL.
    if (
      (pathSegments[0] === 'album' || pathSegments[0] === 'showcase') &&
      pathSegments[1] &&
      numericRegex.test(pathSegments[1])
    ) {
      const albumId = pathSegments[1]

      return [
        {
          uri: `${origin}/album/${albumId}/rss`,
          hint: composeHint('vimeo:album'),
        },
      ]
    }

    // User page: vimeo.com/{user}
    if (pathSegments.length > 0) {
      const user = pathSegments[0]

      // Skip excluded paths and numeric-only segments (video IDs).
      if (!isAnyOf(user, excludedPaths) && !numericRegex.test(user)) {
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
