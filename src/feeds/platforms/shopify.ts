import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const shopifyRegex = /shopify/i

export const isShopifyHeaders = (headers: Headers): boolean => {
  return shopifyRegex.test(headers.get('powered-by') ?? '')
}

const getBlogHandle = (url: string): string | undefined => {
  const segments = getPathSegments(url)

  return isAnyOf(segments[0], 'blogs') ? segments[1] : undefined
}

export const shopifyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isShopifyHeaders })) {
      return false
    }

    return Boolean(getBlogHandle(url))
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const handle = getBlogHandle(url)

    if (!handle) {
      return []
    }

    return [{ uri: `${origin}/blogs/${handle}.atom`, hint: composeHint('shopify:blog') }]
  },
}
