import { bing } from 'feedintel'
import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: search.
// Handler needed for: news.

export type BingUrl = { kind: 'search'; query: string } | { kind: 'news'; query: string }

// Unverified: cn.bing.com redirects to www.bing.com outside China, so its feed was never read.
const hosts = bing.hosts.exact

const searchRegex = /^\/search\/?$/i
const newsRegex = /^\/news\/search\/?$/i

const feeds = withHintLabels(bing.feeds)

export const parseBingUrl = (url: string): BingUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const query = getQueryParam(searchParams, 'q')

  // Bing answers any query, an empty one too, with a feed. Without a query it holds no results.
  if (!query) {
    return
  }

  if (searchRegex.test(pathname)) {
    return { kind: 'search', query }
  }

  if (newsRegex.test(pathname)) {
    return { kind: 'news', query }
  }
}

export const bingHandler: PlatformHandler = {
  match: (url) => {
    return parseBingUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBingUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'news') {
      return [pageFeeds.getFeedEntry('news', { query: parsed.query })]
    }

    return [pageFeeds.getFeedEntry('search', { query: parsed.query })]
  },

  getFeedHint: feeds.getFeedHint,
}
