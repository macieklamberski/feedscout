import { getPathSegments } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl = { kind: 'collection'; collection: string }

const domains = ['squarespace.com']

const squarespaceRegex = /squarespace/i

const feeds = definePlatformFeeds(
  [{ key: 'squarespace:collection', template: '{scheme}://{host}/{collection}?format=rss' }],
  { domains },
)

// A site on its own domain is known only by its marker, so only a feed on a squarespace.com site
// is claimed.
const ownFeeds = definePlatformFeeds(
  [
    {
      key: 'squarespace:collection',
      template: '{scheme}://{site}.{domain}/{collection}?format=rss',
    },
    {
      key: 'squarespace:category',
      template: '{scheme}://{site}.{domain}/{collection}?category={category}&format=rss',
    },
    {
      key: 'squarespace:tag',
      template: '{scheme}://{site}.{domain}/{collection}?tag={tag}&format=rss',
    },
  ],
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('squarespace:collection', { collection: parsed.collection })]
  },

  getFeedHint: ownFeeds.getFeedHint,
}
