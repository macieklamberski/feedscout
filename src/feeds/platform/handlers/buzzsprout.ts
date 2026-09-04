import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Buzzsprout podcast pages at `buzzsprout.com/{id}` (and episode, about, and
// contributor subpaths) advertise the canonical RSS via standard
// `<link rel="alternate">` pointing at `feeds.buzzsprout.com/{id}.rss`, which
// 301-redirects to `rss.buzzsprout.com/{id}.rss`. Vanity hosts
// (`{slug}.buzzsprout.com`) and user-mapped custom domains are not statically
// resolvable without a fetch.
// The handler extracts the numeric podcast ID from any subpath and emits the
// post-redirect `rss.buzzsprout.com` URL directly, saving a hop.

const hosts = ['buzzsprout.com', 'www.buzzsprout.com']
const numericRegex = /^\d+$/

export const buzzsproutHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const podcastId = pathSegments[0]

    if (!numericRegex.test(podcastId)) {
      return []
    }

    return [
      {
        uri: `https://rss.buzzsprout.com/${podcastId}.rss`,
        hint: composeHint('buzzsprout:podcast'),
      },
    ]
  },
}
