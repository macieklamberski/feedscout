import { soundon } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: podcast.

export type SoundonUrl = { kind: 'podcast'; podcastId: string }

const feeds = withHintLabels(soundon.feeds)

export const parseSoundonUrl = (url: string): SoundonUrl | undefined => {
  const page = soundon.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'podcast', podcastId: page.values.podcastId }
}

export const soundonHandler: PlatformHandler = {
  match: (url) => {
    return parseSoundonUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSoundonUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { podcastId: parsed.podcastId })]
  },

  getFeedHint: feeds.getFeedHint,
}
