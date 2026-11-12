import { getPathSegments } from 'trousse'
import { definePlatformFeeds, type PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl = { kind: 'collection'; collection: string }

const domains = ['squarespace.com']

const squarespaceRegex = /squarespace/i

const ownFeeds = definePlatformFeeds(
  [
    {
      key: 'squarespace:collection',
      template: '{scheme}://{site}.{domain}/{collection}?format=rss',
    },
  ],
  { domains },
)

// A site on its own domain is known only by its marker, so its feeds are built but not claimed.
const siteFeeds = definePlatformFeeds(
  [{ key: 'squarespace:collection', template: '{scheme}://{host}/{collection}?format=rss' }],
  { domains },
)

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return squarespaceRegex.test(headers.get('server') ?? '')
}

export const parseSquarespaceUrl = (url: string): SquarespaceUrl | undefined => {
  const [collection] = getPathSegments(url)

  if (!collection) {
    return
  }

  return { kind: 'collection', collection }
}

export const squarespaceHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isSquarespaceHeaders })) {
      return false
    }

    return parseSquarespaceUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSquarespaceUrl(url)
    const site = getTenantSubdomain(url, domains)
    const page = site ? ownFeeds.forUrl(url) : siteFeeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const params: PlatformFeedParams = { collection: parsed.collection }

    if (site) {
      params.site = site
    }

    return [page.getFeedEntry('squarespace:collection', params)]
  },

  getFeedHint: ownFeeds.getFeedHint,
}
