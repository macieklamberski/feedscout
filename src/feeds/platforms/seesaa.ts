import { seesaa } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type SeesaaUrl = { kind: 'blog' }

const feeds = withHintLabels(seesaa.feeds)

export const parseSeesaaUrl = (url: string): SeesaaUrl | undefined => {
  const page = seesaa.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog' }
}

export const seesaaHandler: PlatformHandler = {
  match: (url) => {
    return parseSeesaaUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!parseSeesaaUrl(url) || !page) {
      return []
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'rdf'),
      page.getFeedEntry('podcast', {}, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
