import { buzzsprout } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BuzzsproutUrl = { kind: 'podcast'; podcastId: string }

const feeds = withHintLabels(buzzsprout.feeds)

export const parseBuzzsproutUrl = (url: string): BuzzsproutUrl | undefined => {
  const page = buzzsprout.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'podcast', podcastId: page.params.podcastId }
}

export const buzzsproutHandler: PlatformHandler = {
  match: (url) => {
    return parseBuzzsproutUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBuzzsproutUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { podcastId: parsed.podcastId })]
  },

  getFeedHint: feeds.getFeedHint,
}
