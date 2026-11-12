import { getPathSegments, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, letterGroupsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string; locale?: string }

const shopifyRegex = /shopify/i

const domains = ['myshopify.com']

// A store on its own domain is known only by its header, so its feeds are built here but not
// claimed. A blog tag, a collection and a collection narrowed to product tags are linked from pages
// `resolve` does not read, so the table only claims them.
const feeds = definePlatformFeeds(
  [
    { key: 'shopify:blog', template: '{scheme}://{host}/{locale}/blogs/{handle}.atom' },
    { key: 'shopify:blog', template: '{scheme}://{host}/blogs/{handle}.atom' },
    {
      key: 'shopify:blog-tag',
      template: '{scheme}://{host}/{locale}/blogs/{handle}/tagged/{tag}.atom',
    },
    { key: 'shopify:blog-tag', template: '{scheme}://{host}/blogs/{handle}/tagged/{tag}.atom' },
    { key: 'shopify:collection', template: '{scheme}://{host}/{locale}/collections/{handle}.atom' },
    { key: 'shopify:collection', template: '{scheme}://{host}/collections/{handle}.atom' },
    {
      key: 'shopify:collection-tag',
      template: '{scheme}://{host}/{locale}/collections/{handle}/{tags}.atom',
    },
    {
      key: 'shopify:collection-tag',
      template: '{scheme}://{host}/collections/{handle}/{tags}.atom',
    },
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

    return [page.getFeedEntry('shopify:blog', { locale: parsed.locale, handle: parsed.handle })]
  },

  getFeedHint: feeds.getFeedHint,
}
