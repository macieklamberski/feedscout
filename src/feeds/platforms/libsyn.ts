import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['libsyn.com']
const feedHosts = ['feeds.libsyn.com']
const numericRegex = /^\d+$/

export const libsynHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    if (isHostOf(url, feedHosts)) {
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
