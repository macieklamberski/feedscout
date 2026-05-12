import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Libsyn serves one RSS 2.0 podcast feed per show at `{slug}.libsyn.com/rss`
// and `feeds.libsyn.com/{showId}/rss`; HTML pages autodiscover the canonical
// numeric form via `<link rel="alternate" type="application/rss+xml">`. No
// Atom, JSON Feed, or sub-feed (category, tag, mp3-only) routes exist. The
// handler preserves the `feeds.libsyn.com/{showId}` show ID instead of
// stripping to the apex (which 404s), and emits `${origin}/rss` for the
// per-slug subdomain form.

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

      // feeds.libsyn.com without a numeric show ID has no useful feed
      // (apex /rss returns 404).
      return []
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('libsyn:podcast') }]
  },
}
