import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const numericRegex = /^\d+$/

export const libsynHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'libsyn.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    if (isHostOf(url, 'feeds.libsyn.com')) {
      const showId = pathname.split('/').find(Boolean)

      if (showId && numericRegex.test(showId)) {
        return [
          {
            uri: `https://feeds.libsyn.com/${showId}/rss`,
            hint: composeHint('libsyn:podcast'),
          },
        ]
      }

      // feeds.libsyn.com without a numeric show ID has no useful feed
      // (apex /rss returns 404).
      return []
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('libsyn:podcast') }]
  },
}
