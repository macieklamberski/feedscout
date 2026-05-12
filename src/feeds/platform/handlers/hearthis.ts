import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Hearthis.at exposes one RSS 2.0 podcast feed per user at
// `hearthis.at/{user}/podcast/` (with `/podcast.xml` serving the same body)
// plus a global `/new_tracks.rss` firehose; both forms are advertised via
// `<link rel="alternate" type="application/rss+xml">` on the user and
// homepage HTML. There are no per-set, per-genre, per-category, per-tag, or
// likes feeds — every probed variant 404s, 410s, or returns HTML.

const hosts = ['hearthis.at', 'www.hearthis.at']
const excludedPaths = [
  'about',
  'api',
  'feed',
  'login',
  'privacy',
  'search',
  'set',
  'signup',
  'terms',
]

export const hearthisHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://hearthis.at/${username}/podcast/`,
        hint: composeHint('hearthis:tracks'),
      },
    ]
  },
}
