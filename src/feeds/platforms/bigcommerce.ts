import { getQueryParam, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, category-new-products, category-popular-products, new-products, popular-products, search.
// Handler needed for: featured-products.

const categoryFeedRegex = /^[^?#]*\/rss\.php\?(?:[^#]*&)?categoryid=(?<categoryId>[1-9]\d*)/i

export type BigcommercePage =
  | { kind: 'category'; categoryId: string }
  | { kind: 'search'; query: string }
  | { kind: 'home' }

const domains = ['mybigcommerce.com']

// A store on a custom domain is known only by its session cookie, so its feeds are built here but
// claimed only on BigCommerce's own domain.
const feeds = definePlatformFeeds(
  'bigcommerce',
  [
    // Without `type`, each feed answers its RSS twin.
    {
      key: 'category-new-products',
      main: '{scheme}://{host}/rss.php?categoryid={categoryId}&type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php?categoryid={categoryId}'],
    },
    {
      key: 'category-new-products',
      main: '{scheme}://{host}/rss.php?categoryid={categoryId}&type=atom',
      format: 'atom',
    },
    {
      key: 'category-popular-products',
      main: '{scheme}://{host}/rss.php?action=popularproducts&categoryid={categoryId}&type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php?action=popularproducts&categoryid={categoryId}'],
    },
    {
      key: 'category-popular-products',
      main: '{scheme}://{host}/rss.php?action=popularproducts&categoryid={categoryId}&type=atom',
      format: 'atom',
    },
    {
      key: 'search',
      main: '{scheme}://{host}/rss.php?action=searchproducts&search_query={query}&type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php?action=searchproducts&search_query={query}'],
    },
    {
      key: 'search',
      main: '{scheme}://{host}/rss.php?action=searchproducts&search_query={query}&type=atom',
      format: 'atom',
    },
    {
      key: 'new-products',
      main: '{scheme}://{host}/rss.php?type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php'],
    },
    {
      key: 'new-products',
      main: '{scheme}://{host}/rss.php?type=atom',
      format: 'atom',
    },
    {
      key: 'popular-products',
      main: '{scheme}://{host}/rss.php?action=popularproducts&type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php?action=popularproducts'],
    },
    {
      key: 'popular-products',
      main: '{scheme}://{host}/rss.php?action=popularproducts&type=atom',
      format: 'atom',
    },
    {
      key: 'featured-products',
      main: '{scheme}://{host}/rss.php?action=featuredproducts&type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php?action=featuredproducts'],
    },
    {
      key: 'featured-products',
      main: '{scheme}://{host}/rss.php?action=featuredproducts&type=atom',
      format: 'atom',
    },
    {
      key: 'blog',
      main: '{scheme}://{host}/rss.php?action=newblogs&type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss.php?action=newblogs'],
    },
    {
      key: 'blog',
      main: '{scheme}://{host}/rss.php?action=newblogs&type=atom',
      format: 'atom',
    },
  ],
  { hosts: { tenants: domains } },
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

  if (isAnyOf(pathname, '/search.php') && query) {
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
        pageFeeds.getFeedEntry('category-new-products', params, 'rss'),
        pageFeeds.getFeedEntry('category-new-products', params, 'atom'),
        pageFeeds.getFeedEntry('category-popular-products', params, 'rss'),
        pageFeeds.getFeedEntry('category-popular-products', params, 'atom'),
        pageFeeds.getFeedEntry('new-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('new-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('popular-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('popular-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('featured-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('featured-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('blog', undefined, 'rss'),
        pageFeeds.getFeedEntry('blog', undefined, 'atom'),
      ]
    }

    if (page.kind === 'search') {
      return [
        pageFeeds.getFeedEntry('search', { query: page.query }, 'rss'),
        pageFeeds.getFeedEntry('search', { query: page.query }, 'atom'),
        pageFeeds.getFeedEntry('new-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('new-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('popular-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('popular-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('featured-products', undefined, 'rss'),
        pageFeeds.getFeedEntry('featured-products', undefined, 'atom'),
        pageFeeds.getFeedEntry('blog', undefined, 'rss'),
        pageFeeds.getFeedEntry('blog', undefined, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('new-products', undefined, 'rss'),
      pageFeeds.getFeedEntry('new-products', undefined, 'atom'),
      pageFeeds.getFeedEntry('popular-products', undefined, 'rss'),
      pageFeeds.getFeedEntry('popular-products', undefined, 'atom'),
      pageFeeds.getFeedEntry('featured-products', undefined, 'rss'),
      pageFeeds.getFeedEntry('featured-products', undefined, 'atom'),
      pageFeeds.getFeedEntry('blog', undefined, 'rss'),
      pageFeeds.getFeedEntry('blog', undefined, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
