import { bigcommerce } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, category-new-products, category-popular-products, new-products, popular-products, search.
// Handler needed for: featured-products.

export type BigcommercePage =
  | { kind: 'category'; categoryId: string }
  | { kind: 'search'; query: string }
  | { kind: 'home' }

const feeds = withHintLabels(bigcommerce.feeds)

export const isBigcommerceHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('SHOP_SESSION_TOKEN')
}

// A category url carries only its slug, and rss.php answers a made-up category id with an
// empty feed, so the id comes from the feed link the category page prints.
const getLinkedCategoryId = (url: string, href: string | undefined): string | undefined => {
  const feedUrl = parseUrl(href, url)

  if (!feedUrl) {
    return
  }

  const feed = bigcommerce.feeds.read(feedUrl.href, { isAnyHost: true })

  if (feed?.key !== 'category-new-products' && feed?.key !== 'category-popular-products') {
    return
  }

  return feed.params.categoryId
}

const getCategoryId = (url: string, content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && getLinkedCategoryId(url, element.attribs.href) !== undefined
  })

  return getLinkedCategoryId(url, link?.attribs.href)
}

const getBigcommercePage = (url: string, content: string | undefined): BigcommercePage => {
  const page = bigcommerce.pages.read(url, { isAnyHost: true })

  if (page?.key === 'search') {
    return { kind: 'search', query: page.params.query }
  }

  const categoryId = getCategoryId(url, content)

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
