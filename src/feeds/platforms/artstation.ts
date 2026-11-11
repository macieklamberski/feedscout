import { getPathSegments, isAnyOf, isHostOf, isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profileSubdomain (html).
// Handler needed for: albums, explore, profile.

export type ArtstationUrl = { kind: 'profile'; username: string } | { kind: 'artwork' }

const domains = ['artstation.com']
const hosts = ['artstation.com', 'www.artstation.com']

// `/artwork.rss` reads before `/{username}.rss`, so the site feed never reads as a user's.
const feeds = definePlatformFeeds([
  { key: 'artstation:artwork', template: 'https://www.artstation.com/artwork.rss' },
  {
    key: 'artstation:artwork-latest',
    template: 'https://www.artstation.com/artwork.rss?sorting=latest',
  },
  { key: 'artstation:portfolio', template: 'https://www.artstation.com/{username}.rss' },
])

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

  const [routeOrUsername, artworkId] = getPathSegments(url)

  if (!routeOrUsername) {
    return { kind: 'artwork' }
  }

  // Global artwork page: /artwork. A single artwork at /artwork/{id} names its artist only in the
  // page.
  if (isAnyOf(routeOrUsername, 'artwork')) {
    if (artworkId) {
      return
    }

    return { kind: 'artwork' }
  }

  // ArtStation names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (routeOrUsername.includes('.')) {
    return
  }

  return { kind: 'profile', username: routeOrUsername }
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
        feeds.getFeedEntry('artstation:artwork'),
        feeds.getFeedEntry('artstation:artwork-latest'),
      ]
    }

    return [feeds.getFeedEntry('artstation:portfolio', { username: parsed.username })]
  },

  getFeedKey: feeds.getFeedKey,
}
