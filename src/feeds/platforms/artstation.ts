import { artstation } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: artwork, portfolio.

export type ArtstationUrl = { kind: 'profile'; username: string } | { kind: 'artwork' }

const feeds = withHintLabels(artstation.feeds)

// A single artwork names its artist only in the page.
export const parseArtstationUrl = (url: string): ArtstationUrl | undefined => {
  const page = artstation.pages.read(url)

  if (!page || page.key === 'project') {
    return
  }

  if (page.key === 'profile') {
    return { kind: 'profile', username: page.params.username }
  }

  return { kind: 'artwork' }
}

export const artstationHandler: PlatformHandler = {
  match: (url) => {
    return parseArtstationUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArtstationUrl(url)

    if (!parsed) {
      return []
    }

    // The artwork feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'artwork') {
      return [feeds.getFeedEntry('artwork'), feeds.getFeedEntry('artwork', { sorting: 'latest' })]
    }

    return [
      feeds.getFeedEntry('portfolio', { username: parsed.username }),
      feeds.getFeedEntry('artwork'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
