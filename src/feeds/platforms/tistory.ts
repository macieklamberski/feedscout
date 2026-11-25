import { tistory } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type TistoryUrl = { kind: 'blog' }

const feeds = withHintLabels(tistory.feeds)

export const parseTistoryUrl = (url: string): TistoryUrl | undefined => {
  if (!tistory.pages.readUrl(url)) {
    return
  }

  return { kind: 'blog' }
}

export const tistoryHandler: PlatformHandler = {
  match: (url) => {
    return parseTistoryUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!parseTistoryUrl(url) || !page) {
      return []
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
