import { getPathSegments } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const shopifyRegex = /shopify/i

export const isShopifyHeaders = (headers: Headers): boolean => {
  return shopifyRegex.test(headers.get('powered-by') ?? '')
}

const getBlogHandle = (url: string): string | undefined => {
  const segments = getPathSegments(url)

  return segments[0] === 'blogs' ? segments[1] : undefined
}

export const shopifyHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    return Boolean(headers && isShopifyHeaders(headers)) && Boolean(getBlogHandle(url))
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
