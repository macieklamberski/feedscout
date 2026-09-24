import { parseFeed } from 'feedsmith'
import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  excludedPaths,
  hosts,
  publicationRegex,
  tagRegex,
  userRegex,
} from '../../feeds/platforms/medium.js'
import type { FaviconEnricher } from '../types.js'

const platform = 'medium'

// Medium's CDN crops to a square only under `/fit/c/{size}/{size}/`.
const squareImageRegex = /\/fit\/c\/(\d+)\/\1\//

// Publications without a logo carry Medium's 545x106 wordmark.
const wordmarkImageId = '1*TGH72Nnw24QL3iV9IOm4VA'

// Returns the feed path segment: `@{username}` for a profile, the slug for a publication.
const getFeedId = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const userMatch = pathname.match(userRegex)

  if (userMatch?.[1]) {
    return `@${userMatch[1]}`
  }

  if (tagRegex.test(pathname)) {
    return
  }

  const publicationMatch = pathname.match(publicationRegex)

  if (!publicationMatch?.[1] || isAnyOf(publicationMatch[1], [...excludedPaths, 'feed'])) {
    return
  }

  return publicationMatch[1]
}

export const mediumHandler: PlatformHandler = {
  match: (url) => {
    return getFeedId(url) !== undefined
  },

  resolve: (url) => {
    const id = getFeedId(url)

    if (!id) {
      return []
    }

    return [{ platform, id, url }]
  },
}

export const mediumEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const response = await context.fetchFn(`https://medium.com/feed/${ref.id}`)
    const result = parseFeed(typeof response.body === 'string' ? response.body : '')
    const imageUrl = result.format === 'rss' ? result.feed.image?.url : undefined

    if (
      isNonEmptyString(imageUrl) &&
      squareImageRegex.test(imageUrl) &&
      !imageUrl.includes(wordmarkImageId)
    ) {
      return [imageUrl]
    }
  } catch {}

  return []
}
