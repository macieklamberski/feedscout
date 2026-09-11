import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Roughly half of Squarespace sites carry no `alternate` link. A collection
// takes `?format=rss`, and the collection slug is operator-chosen, `/blog`,
// `/news` or `/journal`, so it comes from the first path segment.
//
// The site root answers `?format=rss` with 400, so a root URL is never
// matched. A non-collection page answers 200 with HTML, which discovery
// filters on the root element.

const squarespaceRegex = /squarespace/i
const excludedPaths = ['config', 'api', 'static', 'universal', 'account', 'commerce', 'checkout']

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return squarespaceRegex.test(headers.get('server') ?? '')
}

const getCollection = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  if (!first || excludedPaths.includes(first.toLowerCase())) {
    return
  }

  return first
}

export const squarespaceHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    try {
      if (!headers || !isSquarespaceHeaders(headers)) {
        return false
      }

      return Boolean(getCollection(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)
      const collection = getCollection(url)

      if (!collection) {
        return []
      }

      return [
        {
          uri: `${origin}/${collection}?format=rss`,
          hint: composeHint('squarespace:collection'),
        },
      ]
    } catch {}

    return []
  },
}
