import { behance } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: projects.
// Handler needed for: portfolio.

export type BehanceUrl = { kind: 'profile'; username: string } | { kind: 'home' }

const feeds = withHintLabels(behance.feeds)

export const parseBehanceUrl = (url: string): BehanceUrl | undefined => {
  const page = behance.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'profile') {
    return { kind: 'profile', username: page.params.username }
  }

  // Every other page gets the featured projects, which the home page's own FeedBurner link serves
  // too.
  return { kind: 'home' }
}

export const behanceHandler: PlatformHandler = {
  match: (url) => {
    return parseBehanceUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBehanceUrl(url)

    if (!parsed) {
      return []
    }

    // The featured projects feed needs no value from the page, so every page builds it after its
    // own feeds.
    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('projects')]
    }

    // The appreciated page gets the portfolio feed: Behance ignores
    // `content=appreciated` and serves the user's own projects for it.
    return [
      feeds.getFeedEntry('portfolio', { username: parsed.username }),
      feeds.getFeedEntry('projects'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
