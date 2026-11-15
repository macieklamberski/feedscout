import { getPathSegments, includesAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SquarespaceUrl = { kind: 'collection'; collection: string }

export const isSquarespaceHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('server') ?? undefined, 'squarespace')
}

export const parseSquarespaceUrl = (url: string): SquarespaceUrl | undefined => {
  const [collection] = getPathSegments(url)

  if (!collection) {
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
