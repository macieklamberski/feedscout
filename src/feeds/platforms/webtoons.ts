import { webtoons } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: series.

const feeds = withHintLabels(webtoons.feeds)

export const webtoonsHandler: PlatformHandler = {
  match: (url) => {
    return webtoons.pages.readUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = webtoons.pages.readUrl(url)

    if (!page) {
      return []
    }

    const variant = page.key === 'canvas' ? 'canvas' : undefined

    return [feeds.getFeedEntry('series', page.values, undefined, variant)]
  },

  getFeedHint: feeds.getFeedHint,
}
