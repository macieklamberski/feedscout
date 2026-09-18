import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// NodeBB serves recent and popular feeds at the origin, plus a per-category
// feed at `/category/{cid}.rss` and a per-topic feed at `/topic/{tid}.rss`.

const nodebbRegex = /nodebb/i
const categoryRegex = /\/category\/(\d+)/
const topicRegex = /\/topic\/(\d+)/

export const isNodebbHeaders = (headers: Headers): boolean => {
  return nodebbRegex.test(headers.get('x-powered-by') ?? '')
}

export const nodebbHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    return URL.canParse(url) && Boolean(headers && isNodebbHeaders(headers))
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const categoryId = pathname.match(categoryRegex)?.[1]
      const topicId = pathname.match(topicRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (topicId) {
        uris.push({
          uri: `${origin}/topic/${topicId}.rss`,
          hint: composeHint('nodebb:topic'),
        })
      }

      if (categoryId) {
        uris.push({
          uri: `${origin}/category/${categoryId}.rss`,
          hint: composeHint('nodebb:category'),
        })
      }

      uris.push({ uri: `${origin}/recent.rss`, hint: composeHint('nodebb:recent') })
      uris.push({ uri: `${origin}/popular.rss`, hint: composeHint('nodebb:popular') })

      return uris
    } catch {}

    return []
  },
}
