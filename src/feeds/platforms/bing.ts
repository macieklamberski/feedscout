import { composeQuery, getQueryParam, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers search (html).
// Handler needed for: news.

export type BingUrl = { kind: 'search'; query: string } | { kind: 'news'; query: string }

// Unverified: cn.bing.com redirects to www.bing.com outside China, so its feed was never read.
const hosts = ['bing.com', 'cn.bing.com', 'www.bing.com']

const searchRegex = /^\/search\/?$/i
const newsRegex = /^\/news\/search\/?$/i

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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    // Web and news search answer with RSS when `format=rss` is set.
    const query = composeQuery({ q: parsed.query, format: 'rss' })

    if (parsed.kind === 'news') {
      return [{ uri: `${origin}/news/search${query}`, hint: composeHint('bing:news') }]
    }

    return [{ uri: `${origin}/search${query}`, hint: composeHint('bing:search') }]
  },
}
