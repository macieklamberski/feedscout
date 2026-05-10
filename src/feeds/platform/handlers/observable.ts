import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['observablehq.com', 'www.observablehq.com']
const collectionRegex = /^\/@([^/]+)\/collection\/([^/]+)/
const userRegex = /^\/@([^/]+)/

export const observableHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

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
