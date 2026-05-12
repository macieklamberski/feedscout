import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Observable serves all RSS off-domain on `api.observablehq.com`: per-user/team
// notebooks (`/documents/@{slug}.rss`), per-collection
// (`/collection/@{user}/{slug}.rss`), site-wide recently-published
// (`/documents/public.rss`), and site-wide trending (`/documents/trending.rss`).
// Only RSS is supported — no Atom or JSON Feed variants exist. The handler maps
// the human-facing `/@{slug}`, `/@{user}/collection/{slug}`, `/recent`, and
// `/trending` URL shapes onto the corresponding off-domain RSS endpoints.

const hosts = ['observablehq.com', 'www.observablehq.com']
const collectionRegex = /^\/@([^/]+)\/collection\/([^/]+)/
const userRegex = /^\/@([^/]+)/

export const observableHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Site-wide recent feed.
    if (pathname === '/recent' || pathname === '/recent/') {
      return [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: composeHint('observable:recent'),
        },
      ]
    }

    // Site-wide trending feed.
    if (pathname === '/trending' || pathname === '/trending/') {
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
