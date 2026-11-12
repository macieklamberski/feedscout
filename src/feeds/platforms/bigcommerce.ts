import { getQueryParam } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers category, home, search.

const searchPathRegex = /^\/search\.php$/i
const categoryFeedRegex = /^[^?#]*\/rss\.php\?(?:[^#]*&)?categoryid=(?<categoryId>[1-9]\d*)/i

export type BigcommercePage =
  | { kind: 'category'; categoryId: string }
  | { kind: 'search'; query: string }
  | { kind: 'home' }

const domains = ['mybigcommerce.com']

// A store on a custom domain is known only by its session cookie, so its feeds are built here but
// claimed only on BigCommerce's own domain.
const feeds = definePlatformFeeds(
  [
    {
      key: 'bigcommerce:category-new-products',
      template: '{scheme}://{host}/rss.php?categoryid={categoryId}&type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:category-new-products',
      template: '{scheme}://{host}/rss.php?categoryid={categoryId}&type=atom',
      format: 'atom',
    },
    {
      key: 'bigcommerce:category-popular-products',
      template: '{scheme}://{host}/rss.php?action=popularproducts&categoryid={categoryId}&type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:category-popular-products',
      template:
        '{scheme}://{host}/rss.php?action=popularproducts&categoryid={categoryId}&type=atom',
      format: 'atom',
    },
    {
      key: 'bigcommerce:search',
      template: '{scheme}://{host}/rss.php?action=searchproducts&search_query={query}&type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:search',
      template: '{scheme}://{host}/rss.php?action=searchproducts&search_query={query}&type=atom',
      format: 'atom',
    },
    {
      key: 'bigcommerce:new-products',
      template: '{scheme}://{host}/rss.php?type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:new-products',
      template: '{scheme}://{host}/rss.php?type=atom',
      format: 'atom',
    },
    {
      key: 'bigcommerce:popular-products',
      template: '{scheme}://{host}/rss.php?action=popularproducts&type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:popular-products',
      template: '{scheme}://{host}/rss.php?action=popularproducts&type=atom',
      format: 'atom',
    },
    {
      key: 'bigcommerce:featured-products',
      template: '{scheme}://{host}/rss.php?action=featuredproducts&type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:featured-products',
      template: '{scheme}://{host}/rss.php?action=featuredproducts&type=atom',
      format: 'atom',
    },
    {
      key: 'bigcommerce:blog',
      template: '{scheme}://{host}/rss.php?action=newblogs&type=rss',
      format: 'rss',
    },
    {
      key: 'bigcommerce:blog',
      template: '{scheme}://{host}/rss.php?action=newblogs&type=atom',
      format: 'atom',
    },
  ],
  { domains },
)

export const isBigcommerceHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('SHOP_SESSION_TOKEN')
}

// A category url carries only its slug, and rss.php answers a made-up category id with an
// empty feed, so the id comes from the feed link the category page prints.
const getCategoryId = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && categoryFeedRegex.test(element.attribs.href ?? '')
  })

  return link?.attribs.href?.match(categoryFeedRegex)?.groups?.categoryId
}

const getBigcommercePage = (url: string, content: string | undefined): BigcommercePage => {
  const { pathname, searchParams } = new URL(url)
  const query = getQueryParam(searchParams, 'search_query')

  if (searchPathRegex.test(pathname) && query) {
    return { kind: 'search', query }
  }

  const categoryId = getCategoryId(content)

  if (categoryId) {
    return { kind: 'category', categoryId }
  }

  return { kind: 'home' }
}

export const bigcommerceHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isBigcommerceHeaders })
  },

  resolve: (url, content) => {
    const page = getBigcommercePage(url, content)
    const pageFeeds = feeds.forUrl(url)
    const uris: Array<DiscoverUriEntry> = []

    if (!pageFeeds) {
      return uris
    }

    const feedEntries = (key: string, params?: Record<string, string>) => [
      pageFeeds.getFeedEntry(key, params, 'rss'),
      pageFeeds.getFeedEntry(key, params, 'atom'),
    ]

    if (page.kind === 'category') {
      const params = { categoryId: page.categoryId }

      uris.push(
        ...feedEntries('bigcommerce:category-new-products', params),
        ...feedEntries('bigcommerce:category-popular-products', params),
      )
    }

    if (page.kind === 'search') {
      uris.push(...feedEntries('bigcommerce:search', { query: page.query }))
    }

    uris.push(
      ...feedEntries('bigcommerce:new-products'),
      ...feedEntries('bigcommerce:popular-products'),
      ...feedEntries('bigcommerce:featured-products'),
      ...feedEntries('bigcommerce:blog'),
    )

    return uris
  },

  // The table reads any host under the domain, so the apex and the www host, which do not resolve,
  // are refused first.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
