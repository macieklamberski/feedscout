import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// ArtStation portfolio pages (`{user}.artstation.com` or
// `artstation.com/{user}`) and the global `/artwork` page do not advertise
// their RSS via `<link rel="alternate">`; the SPA renders client-side and the
// feed URLs follow an undocumented `.rss` suffix convention
// (`www.artstation.com/{user}.rss`, `www.artstation.com/artwork.rss`).
// The handler reshapes both the subdomain and path-based user forms into the
// canonical `.rss` URLs and adds the trending/latest artwork variants.

const hosts = ['artstation.com', 'www.artstation.com']
const domainSuffix = /\.artstation\.com$/i
const excludedPaths = [
  'blogs',
  'channels',
  'contests',
  'features',
  'jobs',
  'learning',
  'login',
  'marketplace',
  'prints',
  'search',
  'signup',
  'studios',
  'terms',
]

export const artstationHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) || isSubdomainOf(url, 'artstation.com')
  },

  resolve: (url) => {
    const parsed = new URL(url)

    // Subdomain form: {user}.artstation.com
    if (!isHostOf(url, hosts) && isSubdomainOf(url, 'artstation.com')) {
      const username = parsed.hostname.replace(domainSuffix, '')

      return [
        {
          uri: `https://www.artstation.com/${username}.rss`,
          hint: composeHint('artstation:portfolio'),
        },
      ]
    }

    const pathSegments = parsed.pathname.split('/').filter(Boolean)

    // Global artwork page: /artwork
    if (pathSegments[0] === 'artwork' || pathSegments.length === 0) {
      const uris: Array<DiscoverUriEntry> = []

      uris.push({
        uri: 'https://www.artstation.com/artwork.rss',
        hint: composeHint('artstation:artwork'),
      })
      uris.push({
        uri: 'https://www.artstation.com/artwork.rss?sorting=trending',
        hint: composeHint('artstation:artwork-trending'),
      })

      return uris
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://www.artstation.com/${username}.rss`,
        hint: composeHint('artstation:portfolio'),
      },
    ]
  },
}
