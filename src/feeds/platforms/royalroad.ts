import { royalroad } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RoyalroadUrl = { kind: 'fiction'; fictionId: string }

const feeds = withHintLabels(royalroad.feeds)

export const parseRoyalroadUrl = (url: string): RoyalroadUrl | undefined => {
  const page = royalroad.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'fiction', fictionId: page.params.fictionId }
}

export const royalroadHandler: PlatformHandler = {
  match: (url) => {
    return parseRoyalroadUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRoyalroadUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('fiction', { fictionId: parsed.fictionId })]
  },

  getFeedHint: feeds.getFeedHint,
}
