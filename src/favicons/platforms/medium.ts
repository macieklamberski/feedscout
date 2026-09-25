import { parseFeed } from 'feedsmith'
import { isHostOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hosts, parseMediumUrl } from '../../feeds/platforms/medium.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

// Medium's CDN crops to a square only under `/fit/c/{size}/{size}/`.
const squareImageRegex = /\/fit\/c\/(\d+)\/\1\//

const platform = 'medium'

// Publications without a logo carry Medium's 545x106 wordmark.
const wordmarkImageId = '1*TGH72Nnw24QL3iV9IOm4VA'

const getFeedId = (url: string): string | undefined => {
  const parsed = parseMediumUrl(url)

  if (parsed?.kind === 'user') {
    return `@${parsed.username}`
  }

  if (parsed?.kind === 'publication') {
    return parsed.publication
  }

  if (parsed?.kind === 'subdomain') {
    return parsed.subdomain
  }
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

  // A user subdomain answers 404 at medium.com/feed/{subdomain}, and its own host serves the feed.
  const feedUrl = isHostOf(ref.url, hosts)
    ? `https://medium.com/feed/${ref.id}`
    : `https://${ref.id}.medium.com/feed`
  const response = await context.fetchFn(feedUrl)
  const result = parseFeed(getResponseText(response))
  const imageUrl = result.format === 'rss' ? result.feed.image?.url : undefined

  if (
    isNonEmptyString(imageUrl) &&
    squareImageRegex.test(imageUrl) &&
    !imageUrl.includes(wordmarkImageId)
  ) {
    return [imageUrl]
  }

  return []
}
