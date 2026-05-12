import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// RSS.com shows live at `rss.com/podcasts/{slug}` (with optional `/es/` or
// `/it/` locale prefix) and the show HTML advertises the canonical RSS
// feed at off-domain `media.rss.com/{slug}/feed.xml` via both
// `<link rel="alternate" type="application/rss+xml">` and JSON-LD
// `webFeed`. The handler derives the canonical feed URL directly from the
// slug so callers do not need to fetch the HTML.

const hosts = ['rss.com', 'www.rss.com']
// Optional 2-letter locale prefix, e.g. /es/podcasts/, /it/podcasts/.
const podcastRegex = /^\/(?:[a-z]{2}\/)?podcasts\/([^/]+)/

export const rssComHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(podcastRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `https://media.rss.com/${match[1]}/feed.xml`,
        hint: composeHint('rss-com:podcast'),
      },
    ]
  },
}
