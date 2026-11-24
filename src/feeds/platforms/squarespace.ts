import { squarespace } from 'feedintel'
import {
  decodeSegment,
  getPathSegments,
  getQueryParam,
  includesAnyOf,
  isAnyOf,
  parseUrl,
} from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl =
  | { kind: 'collection'; collection: string }
  | { kind: 'category'; collection: string; category: string }
  | { kind: 'tag'; collection: string; tag: string }

const feeds = withHintLabels(squarespace.feeds)

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('server'), 'squarespace')
}

// A category or tag page filters its collection, by path or by query.
export const parseSquarespaceUrl = (url: string): SquarespaceUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [collection, route, value] = getPathSegments(parsedUrl)

  if (!collection) {
    return
  }

  // A path value reads as a query value does, `+` as a space, since the feed names it in the query:
  // `/category/Bible%20Talks` and `/category/Bible+Talks` both list `Bible Talks`.
  const pathValue = decodeSegment(value?.replaceAll('+', ' '))
  const category = isAnyOf(route, 'category') ? pathValue : getQueryParam(parsedUrl, 'category')

  if (category) {
    return { kind: 'category', collection, category }
  }

  const tag = isAnyOf(route, 'tag') ? pathValue : getQueryParam(parsedUrl, 'tag')

  if (tag) {
    return { kind: 'tag', collection, tag }
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

    if (parsed.kind === 'category') {
      const params = { collection: parsed.collection, category: parsed.category }

      return [
        page.getFeedEntry('category', params, 'rss'),
        page.getFeedEntry('collection', { collection: parsed.collection }, 'rss'),
      ]
    }

    if (parsed.kind === 'tag') {
      const params = { collection: parsed.collection, tag: parsed.tag }

      return [
        page.getFeedEntry('tag', params),
        page.getFeedEntry('collection', { collection: parsed.collection }, 'rss'),
      ]
    }

    return [page.getFeedEntry('collection', { collection: parsed.collection }, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
