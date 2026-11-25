import { acast } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: podcast.

export type AcastUrl = { kind: 'show'; slug: string }

const feeds = withHintLabels(acast.feeds)

export const parseAcastUrl = (url: string): AcastUrl | undefined => {
  const page = acast.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'show', slug: page.values.slug }
}

export const acastHandler: PlatformHandler = {
  match: (url) => {
    return parseAcastUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAcastUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
