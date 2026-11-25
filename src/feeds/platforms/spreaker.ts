import { spreaker } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SpreakerUrl = { kind: 'show'; showId: string }

const feeds = withHintLabels(spreaker.feeds)

export const parseSpreakerUrl = (url: string): SpreakerUrl | undefined => {
  const page = spreaker.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'show', showId: page.values.showId }
}

export const spreakerHandler: PlatformHandler = {
  match: (url) => {
    return parseSpreakerUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSpreakerUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { showId: parsed.showId })]
  },

  getFeedHint: feeds.getFeedHint,
}
