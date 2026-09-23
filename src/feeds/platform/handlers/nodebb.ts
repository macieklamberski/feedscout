import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const nodebbRegex = /nodebb/i
const categoryRegex = /\/category\/(\d+)/
const topicRegex = /\/topic\/(\d+)/

export const isNodebbHeaders = (headers: Headers): boolean => {
  return nodebbRegex.test(headers.get('x-powered-by') ?? '')
}

export const nodebbHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    return Boolean(parseUrl(url)) && Boolean(headers && isNodebbHeaders(headers))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
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
  },
}
