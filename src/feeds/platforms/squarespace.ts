import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl = { kind: 'collection'; collection: string }

const squarespaceRegex = /squarespace/i
const excludedPaths = ['config', 'api', 'static', 'universal', 'account', 'commerce', 'checkout']

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return squarespaceRegex.test(headers.get('server') ?? '')
}

export const parseSquarespaceUrl = (url: string): SquarespaceUrl | undefined => {
  const [collection] = getPathSegments(url)

  if (!collection || isAnyOf(collection, excludedPaths)) {
    return
  }

  return { kind: 'collection', collection }
}

export const squarespaceHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isSquarespaceHeaders })) {
      return false
    }

    return parseSquarespaceUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSquarespaceUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/${parsed.collection}?format=rss`,
        hint: composeHint('squarespace:collection'),
      },
    ]
  },
}
