import { getPathSegments, isAnyOf, isHostOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profileSubdomain (html).
// Handler needed for: albums, explore, profile.

export type ArtstationUrl = { kind: 'profile'; username: string } | { kind: 'artwork' }

const domains = ['artstation.com']
const hosts = ['artstation.com', 'www.artstation.com']

export const parseArtstationUrl = (url: string): ArtstationUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return
  }

  const subdomain = getTenantSubdomain(url, domains)

  // Subdomain form: {user}.artstation.com
  if (!isHostOf(url, hosts)) {
    if (!subdomain) {
      return
    }

    return { kind: 'profile', username: subdomain }
  }

  const [first, second] = getPathSegments(url)

  if (!first) {
    return { kind: 'artwork' }
  }

  // Global artwork page: /artwork. A single artwork at /artwork/{id} names its artist only in the
  // page.
  if (isAnyOf(first, 'artwork')) {
    if (second) {
      return
    }

    return { kind: 'artwork' }
  }

  return { kind: 'profile', username: first }
}

export const artstationHandler: PlatformHandler = {
  match: (url) => {
    return parseArtstationUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArtstationUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'artwork') {
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

    return [
      {
        uri: `https://www.artstation.com/${parsed.username}.rss`,
        hint: composeHint('artstation:portfolio'),
      },
    ]
  },
}
