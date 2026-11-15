import { getPathSegments, includesAnyOf, isAnyOf, isLocale } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { formatSuffixRegex, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string; tag?: string }

const domains = ['myshopify.com']

const routes = ['blogs', 'collections']

// A store on its own domain is known only by its header, so its feeds are built here but not
// claimed. A collection and a collection narrowed to product tags are linked from pages `resolve`
// does not read, so the table only claims them.
const feeds = definePlatformFeeds(
  [
    { key: 'shopify:blog', template: '{scheme}://{host}/blogs/{handle}.atom' },
    { key: 'shopify:blog', template: '{scheme}://{host}/{locale}/blogs/{handle}.atom' },
    { key: 'shopify:blog-tag', template: '{scheme}://{host}/blogs/{handle}/tagged/{tag}.atom' },
    {
      key: 'shopify:blog-tag',
      template: '{scheme}://{host}/{locale}/blogs/{handle}/tagged/{tag}.atom',
    },
    { key: 'shopify:collection', template: '{scheme}://{host}/collections/{handle}.atom' },
    { key: 'shopify:collection', template: '{scheme}://{host}/{locale}/collections/{handle}.atom' },
    {
      key: 'shopify:collection-tag',
      template: '{scheme}://{host}/collections/{handle}/{tags}.atom',
    },
    {
      key: 'shopify:collection-tag',
      template: '{scheme}://{host}/{locale}/collections/{handle}/{tags}.atom',
    },
  ],
  { domains },
)

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
        page.getFeedEntry('shopify:blog', { handle: parsed.handle }),
        page.getFeedEntry('shopify:blog-tag', { handle: parsed.handle, tag: parsed.tag }),
      ]
    }

    return [page.getFeedEntry('shopify:blog', { handle: parsed.handle })]
  },

  // A segment before the route is a market's locale only in its own form.
  getFeedHint: (url) => {
    const [localeOrRoute] = getPathSegments(url)

    if (!isAnyOf(localeOrRoute, routes) && !isLocale(localeOrRoute)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
