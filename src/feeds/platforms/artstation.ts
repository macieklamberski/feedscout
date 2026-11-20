import { artstation } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, isHostOrSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: artwork, portfolio.

export type ArtstationUrl = { kind: 'profile'; username: string } | { kind: 'artwork' }

const domains = artstation.hosts.tenants
const hosts = artstation.hosts.exact

const feeds = withHintLabels(artstation.feeds)

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

    // The artwork feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'artwork') {
      return [feeds.getFeedEntry('artwork'), feeds.getFeedEntry('artwork', { sorting: 'latest' })]
    }

    return [
      feeds.getFeedEntry('portfolio', { username: parsed.username }),
      feeds.getFeedEntry('artwork'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
