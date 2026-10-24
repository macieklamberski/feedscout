import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, localeRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string; locale?: string }

const shopifyRegex = /shopify/i

export const isShopifyHeaders = (headers: Headers): boolean => {
  return shopifyRegex.test(headers.get('powered-by') ?? '')
}

export const parseShopifyUrl = (url: string): ShopifyUrl | undefined => {
  const segments = getPathSegments(url)
  // A market's locale folder, as in `/en-us/blogs/news`.
  const locale = localeRegex.test(segments[0] ?? '') ? segments[0] : undefined
  const [first, handle] = locale ? segments.slice(1) : segments

  if (!isAnyOf(first, 'blogs') || !handle) {
    return
  }

  return { kind: 'blog', handle, locale }
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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const storeUrl = parsed.locale ? `${origin}/${parsed.locale}` : origin

    return [{ uri: `${storeUrl}/blogs/${parsed.handle}.atom`, hint: composeHint('shopify:blog') }]
  },
}
