import { getQueryParam } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

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
    // Without `type`, each feed answers its RSS twin.
    {
      key: 'bigcommerce:category-new-products',
      template: '{scheme}://{host}/rss.php?categoryid={categoryId}',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'bigcommerce:category-popular-products',
      template: '{scheme}://{host}/rss.php?action=popularproducts&categoryid={categoryId}',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'bigcommerce:search',
      template: '{scheme}://{host}/rss.php?action=searchproducts&search_query={query}',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'bigcommerce:popular-products',
      template: '{scheme}://{host}/rss.php?action=popularproducts',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'bigcommerce:featured-products',
      template: '{scheme}://{host}/rss.php?action=featuredproducts',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'bigcommerce:blog',
      template: '{scheme}://{host}/rss.php?action=newblogs',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'bigcommerce:new-products',
      template: '{scheme}://{host}/rss.php',
      format: 'rss',
      isAlias: true,
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

    if (!pageFeeds) {
      return []
    }

    if (page.kind === 'category') {
      const params = { categoryId: page.categoryId }

      return [
        pageFeeds.getFeedEntry('bigcommerce:category-new-products', params, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:category-new-products', params, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:category-popular-products', params, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:category-popular-products', params, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:new-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:new-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:popular-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:popular-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:featured-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:featured-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:blog', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:blog', undefined, 'atom'),
      ]
    }

    if (page.kind === 'search') {
      return [
        pageFeeds.getFeedEntry('bigcommerce:search', { query: page.query }, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:search', { query: page.query }, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:new-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:new-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:popular-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:popular-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:featured-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:featured-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('bigcommerce:blog', undefined, 'rss'),
        pageFeeds.getFeedEntry('bigcommerce:blog', undefined, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('bigcommerce:new-products', undefined, 'rss'),
      pageFeeds.getFeedEntry('bigcommerce:new-products', undefined, 'atom'),
      pageFeeds.getFeedEntry('bigcommerce:popular-products', undefined, 'rss'),
      pageFeeds.getFeedEntry('bigcommerce:popular-products', undefined, 'atom'),
      pageFeeds.getFeedEntry('bigcommerce:featured-products', undefined, 'rss'),
      pageFeeds.getFeedEntry('bigcommerce:featured-products', undefined, 'atom'),
      pageFeeds.getFeedEntry('bigcommerce:blog', undefined, 'rss'),
      pageFeeds.getFeedEntry('bigcommerce:blog', undefined, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
