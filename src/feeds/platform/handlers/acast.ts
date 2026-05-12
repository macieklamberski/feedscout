import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Acast podcast pages live on `shows.acast.com/{slug}`, the legacy
// `play.acast.com/s/{slug}` host, and the embed-player host
// `embed.acast.com/{slug}`, and all resolve to the canonical RSS at
// `feeds.acast.com/public/shows/{slug}`. The shows.acast.com page advertises
// that RSS via standard `<link rel="alternate">` autodiscovery.
// The handler maps the alternate host shapes (play/embed) onto the canonical
// feeds.acast.com URL so legacy and embed links resolve directly.

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
