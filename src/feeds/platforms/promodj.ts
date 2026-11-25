import { promodj } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PromodjUrl = { kind: 'profile'; username: string }

const feeds = withHintLabels(promodj.feeds)

export const parsePromodjUrl = (url: string): PromodjUrl | undefined => {
  const page = promodj.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'profile', username: page.values.username }
}

export const promodjHandler: PlatformHandler = {
  match: (url) => {
    return parsePromodjUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePromodjUrl(url)

    if (!parsed) {
      return []
    }

    const params = { username: parsed.username }

    return [
      feeds.getFeedEntry('podcast', params),
      feeds.getFeedEntry('content', params),
      feeds.getFeedEntry('blog', params),
      feeds.getFeedEntry('favorites', params),
      feeds.getFeedEntry('events', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
