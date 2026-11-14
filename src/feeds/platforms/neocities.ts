import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type NeocitiesUrl = { kind: 'site'; username: string }

const domains = ['neocities.org']
const hosts = ['neocities.org', 'www.neocities.org']

const feeds = definePlatformFeeds([
  { key: 'neocities:updates', template: 'https://neocities.org/site/{username}.rss' },
])

export const parseNeocitiesUrl = (url: string): NeocitiesUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

  if (subdomain) {
    return { kind: 'site', username: subdomain }
  }

  const [route, username] = getPathSegments(url)

  if (!isHostOf(url, hosts) || !isAnyOf(route, 'site') || !username) {
    return
  }

  return { kind: 'site', username }
}

export const neocitiesHandler: PlatformHandler = {
  match: (url) => {
    return parseNeocitiesUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNeocitiesUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('neocities:updates', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
