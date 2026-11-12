import { getPathSegments, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker, letterGroupsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string; locale?: string }

const shopifyRegex = /shopify/i

const domains = ['myshopify.com']

// A store on its own domain is known only by its header, so its feeds are built here but not
// claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'shopify:blog', template: '{scheme}://{host}/{locale}/blogs/{handle}.atom' },
    { key: 'shopify:blog', template: '{scheme}://{host}/blogs/{handle}.atom' },
  ],
  { domains },
)

export const isShopifyHeaders = (headers: Headers): boolean => {
  return shopifyRegex.test(headers.get('powered-by') ?? '')
}

export const parseShopifyUrl = (url: string): ShopifyUrl | undefined => {
  const segments = getPathSegments(url)
  // A market's locale folder, as in `/en-us/blogs/news` or `/zh-hant-hk/blogs/news`.
  const [localeOrRoute] = segments
  const locale = letterGroupsRegex.test(localeOrRoute ?? '') ? localeOrRoute : undefined
  const [route, handle] = locale ? segments.slice(1) : segments

  if (!isAnyOf(route, 'blogs') || !handle) {
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const { handle, locale } = parsed

    if (locale) {
      return [page.getFeedEntry('shopify:blog', { locale, handle })]
    }

    return [page.getFeedEntry('shopify:blog', { handle })]
  },

  // The table reads any host under myshopify.com, so only a store's own subdomain is claimed,
  // never the apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
