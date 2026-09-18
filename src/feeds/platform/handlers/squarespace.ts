import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

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
