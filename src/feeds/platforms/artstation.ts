import { getSubdomain, isAnyOf, isHostOf, isHostOrSubdomainOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profileSubdomain (html).
// Handler needed for: albums, explore, profile.

const hosts = ['artstation.com', 'www.artstation.com']
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
    return isHostOrSubdomainOf(url, 'artstation.com')
  },

  resolve: (url) => {
    const parsed = new URL(url)

    // Subdomain form: {user}.artstation.com
    if (!isHostOf(url, hosts) && isSubdomainOf(url, 'artstation.com')) {
      const username = getSubdomain(parsed, 'artstation.com')

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
