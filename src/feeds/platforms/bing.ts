import { bing } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: search.
// Handler needed for: news.

export type BingUrl = { kind: 'search'; query: string } | { kind: 'news'; query: string }

const feeds = withHintLabels(bing.feeds)

export const parseBingUrl = (url: string): BingUrl | undefined => {
  const page = bing.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'search') {
    return { kind: 'search', query: page.values.query }
  }

  return { kind: 'news', query: page.values.query }
}

export const bingHandler: PlatformHandler = {
  match: (url) => {
    return parseBingUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBingUrl(url)
    const pageFeeds = feeds.forSite(url)

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
