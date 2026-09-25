import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ObservableUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'collection'; owner: string; collection: string }

export const hosts = ['observablehq.com', 'www.observablehq.com']
// The live form carries a `-` segment, `/@{owner}/-/collection/{slug}`.
const collectionRegex = /^\/@([^/]+)\/(?:-\/)?collection\/([^/]+)/
const ownerRegex = /^\/@([^/]+)/
const publicRegex = /^\/public\/?$/
const recentRegex = /^\/recent\/?$/
const trendingRegex = /^\/trending\/?$/

export const parseObservableUrl = (url: string): ObservableUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
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
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)
    const isPublic = publicRegex.test(pathname)

    // `/recent` redirects to `/public?sort=publish_time` and `/trending` to `/public`.
    // Site-wide recent feed.
    if (recentRegex.test(pathname) || (isPublic && searchParams.get('sort') === 'publish_time')) {
      return [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: composeHint('observable:recent'),
        },
      ]
    }

    // Site-wide trending feed.
    if (trendingRegex.test(pathname) || isPublic) {
      return [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: composeHint('observable:trending'),
        },
      ]
    }

    const parsed = parseObservableUrl(url)

    if (parsed?.kind === 'collection') {
      return [
        {
          uri: `https://api.observablehq.com/collection/@${parsed.owner}/${parsed.collection}.rss`,
          hint: composeHint('observable:collection'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://api.observablehq.com/documents/@${parsed.owner}.rss`,
          hint: composeHint('observable:notebooks'),
        },
      ]
    }

    return []
  },
}
