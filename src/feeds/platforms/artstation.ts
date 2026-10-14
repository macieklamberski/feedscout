import { getPathSegments, isAnyOf, isHostOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profileSubdomain (html).
// Handler needed for: albums, explore, profile.

export type ArtstationUrl = { kind: 'profile'; username: string } | { kind: 'artwork' }

const domains = ['artstation.com']
const hosts = ['artstation.com', 'www.artstation.com']
const excludedSubdomains = ['magazine', 'cdna', 'cdnb']
const excludedPaths = [
  'about',
  'api',
  'blogs',
  'challenges',
  'channels',
  'contests',
  'embed',
  'hire',
  'jobs',
  'learning',
  'login',
  'marketplace',
  'messages',
  'notifications',
  'prints',
  'privacy',
  'projects',
  'registration',
  'schools',
  'search',
  'signup',
  'studios',
  'terms',
  'tos',
  'users',
]

export const parseArtstationUrl = (url: string): ArtstationUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return
  }

  const subdomain = getTenantSubdomain(url, domains, excludedSubdomains)

  // Subdomain form: {user}.artstation.com
  if (!isHostOf(url, hosts)) {
    if (!subdomain) {
      return
    }

    return { kind: 'profile', username: subdomain }
  }

  const [first] = getPathSegments(url)

  // Global artwork page: /artwork
  if (!first || isAnyOf(first, 'artwork')) {
    return { kind: 'artwork' }
  }

  if (isAnyOf(first, excludedPaths)) {
    return
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
