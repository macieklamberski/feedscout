import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.
//
// HTML autodiscovery on libsyn pages returns the underlying
// rss.libsyn.com/shows/{showId}/destinations/{destId}.xml whose IDs aren't derivable
// from the user's slug. The handler emits {slug}.libsyn.com/rss which 302-redirects
// to that resolved URL. For the canonical feeds.libsyn.com/{showId}/rss form
// (advertised by every libsyn-hosted page), preserve the show ID instead of stripping
// the path to apex (which 404s).

const numericRegex = /^\d+$/

export const libsynHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'libsyn.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    if (isHostOf(url, 'feeds.libsyn.com')) {
      const showId = pathname.split('/').filter(Boolean)[0]

      if (showId && numericRegex.test(showId)) {
        return [
          {
            uri: `https://feeds.libsyn.com/${showId}/rss`,
            hint: composeHint('libsyn:podcast'),
          },
        ]
      }
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('libsyn:podcast') }]
  },
}
