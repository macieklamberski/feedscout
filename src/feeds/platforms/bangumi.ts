import { bangumi } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, collections.
// Handler needed for: timeline.

export type BangumiUrl = { kind: 'user'; username: string } | { kind: 'home' }

const feeds = withHintLabels(bangumi.feeds)

export const parseBangumiUrl = (url: string): BangumiUrl | undefined => {
  const page = bangumi.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.params.username }
  }

  return { kind: 'home' }
}

export const bangumiHandler: PlatformHandler = {
  match: (url) => {
    return parseBangumiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBangumiUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        pageFeeds.getFeedEntry('collections', { username: parsed.username }),
        pageFeeds.getFeedEntry('timeline', { username: parsed.username }),
      ]
    }

    return [pageFeeds.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
