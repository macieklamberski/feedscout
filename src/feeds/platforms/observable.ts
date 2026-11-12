import { getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ObservableUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'collection'; owner: string; collection: string }
  | { kind: 'recent' }
  | { kind: 'trending' }

export const hosts = ['observablehq.com', 'www.observablehq.com']

// The live form carries a `-` segment, `/@{owner}/-/collection/{slug}`.
const collectionRegex = /^\/@([^/]+)\/(?:-\/)?collection\/([^/]+)/i
const ownerRegex = /^\/@([^/]+)/
const publicRegex = /^\/public\/?$/i
const recentRegex = /^\/recent\/?$/i
const trendingRegex = /^\/trending\/?$/i

const feeds = definePlatformFeeds([
  { key: 'observable:recent', template: 'https://api.observablehq.com/documents/public.rss' },
  { key: 'observable:trending', template: 'https://api.observablehq.com/documents/trending.rss' },
  {
    key: 'observable:collection',
    template: 'https://api.observablehq.com/collection/@{owner}/{collection}.rss',
  },
  { key: 'observable:notebooks', template: 'https://api.observablehq.com/documents/@{owner}.rss' },
])

export const parseObservableUrl = (url: string): ObservableUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const isPublic = publicRegex.test(pathname)
  const sort = getQueryParam(parsedUrl.searchParams, 'sort')

  // `/recent` redirects to `/public?sort=publish_time` and `/trending` to `/public`.
  if (recentRegex.test(pathname) || (isPublic && isAnyOf(sort, 'publish_time'))) {
    return { kind: 'recent' }
  }

  if (trendingRegex.test(pathname) || isPublic) {
    return { kind: 'trending' }
  }

  const collectionMatch = pathname.match(collectionRegex)

  if (collectionMatch?.[1] && collectionMatch[2]) {
    return { kind: 'collection', owner: collectionMatch[1], collection: collectionMatch[2] }
  }

  const owner = pathname.match(ownerRegex)?.[1]

  if (!owner) {
    return
  }

  return { kind: 'user', owner }
}

export const observableHandler: PlatformHandler = {
  match: (url) => {
    return parseObservableUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseObservableUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'recent') {
      return [feeds.getFeedEntry('observable:recent')]
    }

    if (parsed.kind === 'trending') {
      return [feeds.getFeedEntry('observable:trending')]
    }

    if (parsed.kind === 'collection') {
      const params = { owner: parsed.owner, collection: parsed.collection }

      return [feeds.getFeedEntry('observable:collection', params)]
    }

    return [feeds.getFeedEntry('observable:notebooks', { owner: parsed.owner })]
  },

  getFeedKey: feeds.getFeedKey,
}
