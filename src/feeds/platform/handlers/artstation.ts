import { isAnyOf, isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// ArtStation portfolio pages (`{user}.artstation.com` or
// `artstation.com/{user}`) and the global `/artwork` page do not advertise
// their RSS via `<link rel="alternate">`; the SPA renders client-side and the
// feed URLs follow an undocumented `.rss` suffix convention
// (`www.artstation.com/{user}.rss`, `www.artstation.com/artwork.rss`).
// The handler reshapes both the subdomain and path-based user forms into the
// canonical `.rss` URLs. `?sorting=trending` is the default and returns the
// same 50 items as the bare feed; `?sorting=latest` returns a different set.

const hosts = ['artstation.com', 'www.artstation.com']
const domainSuffixRegex = /\.artstation\.com$/i
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
      const username = parsed.hostname.replace(domainSuffixRegex, '')

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
      return [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: composeHint('artstation:artwork'),
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: composeHint('artstation:artwork-latest'),
        },
      ]
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
