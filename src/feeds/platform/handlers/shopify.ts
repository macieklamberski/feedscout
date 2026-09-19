import { getPathSegments, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A Shopify store's blog serves Atom at `/blogs/{handle}.atom`. Blog pages
// carry only `hreflang` alternates, and discovery finds the feed through an
// anchor, so the handler exists to resolve it without a page fetch.
//
// There is no store-wide feed: `/blogs.atom` answers 404 with
// `content-type: application/atom+xml` and an empty body, so the blog handle
// is required and content-type alone never proves a hit.

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
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl
    const handle = getBlogHandle(url)

    if (!handle) {
      return []
    }

    return [{ uri: `${origin}/blogs/${handle}.atom`, hint: composeHint('shopify:blog') }]
  },
}
