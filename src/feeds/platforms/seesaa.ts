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

    // The domains redirect http to https. The table writes stablo.jp's feeds over http itself.
    const params = { scheme: 'https' }

    return [
      page.getFeedEntry('posts', params, 'rss'),
      page.getFeedEntry('posts', params, 'rdf'),
      page.getFeedEntry('podcast', params, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
