import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.
//
// HTML autodiscovery on libsyn pages returns the underlying
// rss.libsyn.com/shows/{showId}/destinations/{destId}.xml whose IDs aren't derivable
// from the user's slug. The handler emits {slug}.libsyn.com/rss which 302-redirects
// to that resolved URL.

export const libsynHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'libsyn.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('libsyn:podcast') }]
  },
}
