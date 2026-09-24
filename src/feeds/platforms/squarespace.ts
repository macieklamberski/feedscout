import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const squarespaceRegex = /squarespace/i
const excludedPaths = ['config', 'api', 'static', 'universal', 'account', 'commerce', 'checkout']

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return squarespaceRegex.test(headers.get('server') ?? '')
}

const getCollection = (url: string): string | undefined => {
  const [first] = getPathSegments(url)

  if (!first || isAnyOf(first, excludedPaths)) {
    return
  }

  return first
}

export const squarespaceHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    if (!headers || !isSquarespaceHeaders(headers)) {
      return false
    }

    return Boolean(getCollection(url))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl
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
  },
}
