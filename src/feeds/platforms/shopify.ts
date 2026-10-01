import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string }

const shopifyRegex = /shopify/i

export const isShopifyHeaders = (headers: Headers): boolean => {
  return shopifyRegex.test(headers.get('powered-by') ?? '')
}

export const parseShopifyUrl = (url: string): ShopifyUrl | undefined => {
  const [first, handle] = getPathSegments(url)

  if (!isAnyOf(first, 'blogs') || !handle) {
    return
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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/blogs/${parsed.handle}.atom`, hint: composeHint('shopify:blog') }]
  },
}
