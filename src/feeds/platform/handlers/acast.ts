import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

// shows.acast.com is the canonical web host. play.acast.com is a legacy host that
// 302-redirects to shows.acast.com (slug at path index 1, after /s/). embed.acast.com
// is the embed-player host (slug at path index 0).
const hosts = ['shows.acast.com', 'play.acast.com', 'embed.acast.com']
const excludedPaths = ['discover']

export const acastHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { hostname, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    // play.acast.com/s/{slug} — slug is at index 1.
    const slugIndex = hostname.toLowerCase() === 'play.acast.com' ? 1 : 0
    const slug = pathSegments[slugIndex]

    if (!slug || isAnyOf(slug, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://feeds.acast.com/public/shows/${slug}`,
        hint: composeHint('acast:podcast'),
      },
    ]
  },
}
