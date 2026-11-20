import { shopify } from 'feedintel'
import { getPathSegments, includesAnyOf, isAnyOf, isLocale } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { formatSuffixRegex, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string; tag?: string }

const feeds = withHintLabels(shopify.feeds)

export const isShopifyHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('powered-by'), 'shopify')
}

export const parseShopifyUrl = (url: string): ShopifyUrl | undefined => {
  const segments = getPathSegments(url)
  // A market's locale folder, as in `/en-us/blogs/news` or `/zh-hant-hk/blogs/news`.
  const [localeOrRoute] = segments
  const locale = localeOrRoute && isLocale(localeOrRoute) ? localeOrRoute : undefined
  const [route, handleSegment, taggedWord, tag] = locale ? segments.slice(1) : segments
  // A handle or a tag holds no dot, so a feed URL's `.atom` is a format, not part of either.
  const handle = handleSegment?.replace(formatSuffixRegex, '')

  if (!isAnyOf(route, 'blogs') || !handle) {
    return
  }

  if (isAnyOf(taggedWord, 'tagged') && tag) {
    return { kind: 'blog', handle, tag: tag.replace(formatSuffixRegex, '') }
  }

  return { kind: 'blog', handle }
}

export const shopifyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isShopifyHeaders })) {
      return false
    }

    return parseShopifyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseShopifyUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.tag) {
      return [
        page.getFeedEntry('blog', { handle: parsed.handle }),
        page.getFeedEntry('blog-tag', { handle: parsed.handle, tag: parsed.tag }),
      ]
    }

    return [page.getFeedEntry('blog', { handle: parsed.handle })]
  },

  getFeedHint: feeds.getFeedHint,
}
