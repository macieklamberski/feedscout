import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export const hosts = ['observablehq.com', 'www.observablehq.com']
// The live form carries a `-` segment, `/@{user}/-/collection/{slug}`.
export const collectionRegex = /^\/@([^/]+)\/(?:-\/)?collection\/([^/]+)/
const userRegex = /^\/@([^/]+)/

export const observableHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)
    const isPublic = pathname === '/public' || pathname === '/public/'

    // `/recent` redirects to `/public?sort=publish_time` and `/trending` to `/public`.
    // Site-wide recent feed.
    if (
      pathname === '/recent' ||
      pathname === '/recent/' ||
      (isPublic && searchParams.get('sort') === 'publish_time')
    ) {
      return [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: composeHint('observable:recent'),
        },
      ]
    }

    // Site-wide trending feed.
    if (pathname === '/trending' || pathname === '/trending/' || isPublic) {
      return [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: composeHint('observable:trending'),
        },
      ]
    }

    // Collection page: /@{user}/collection/{slug}
    const collectionMatch = pathname.match(collectionRegex)

    if (collectionMatch?.[1] && collectionMatch?.[2]) {
      return [
        {
          uri: `https://api.observablehq.com/collection/@${collectionMatch[1]}/${collectionMatch[2]}.rss`,
          hint: composeHint('observable:collection'),
        },
      ]
    }

    const userMatch = pathname.match(userRegex)

    if (!userMatch?.[1]) {
      return []
    }

    return [
      {
        uri: `https://api.observablehq.com/documents/@${userMatch[1]}.rss`,
        hint: composeHint('observable:notebooks'),
      },
    ]
  },
}
