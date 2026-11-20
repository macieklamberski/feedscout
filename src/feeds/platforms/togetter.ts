import { togetter } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: curator, hot, news, recent.

export type TogetterUrl = { kind: 'user'; username: string } | { kind: 'recent' } | { kind: 'home' }

const feeds = withHintLabels(togetter.feeds)

export const parseTogetterUrl = (url: string): TogetterUrl | undefined => {
  const page = togetter.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.params.username }
  }

  if (page.key === 'recent') {
    return { kind: 'recent' }
  }

  return { kind: 'home' }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return parseTogetterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTogetterUrl(url)

    if (!parsed) {
      return []
    }

    // The news, recent and popular feeds need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('curator', { username: parsed.username }),
        feeds.getFeedEntry('news'),
        feeds.getFeedEntry('recent'),
        feeds.getFeedEntry('hot'),
      ]
    }

    if (parsed.kind === 'recent') {
      return [feeds.getFeedEntry('recent'), feeds.getFeedEntry('news'), feeds.getFeedEntry('hot')]
    }

    return [feeds.getFeedEntry('news'), feeds.getFeedEntry('recent'), feeds.getFeedEntry('hot')]
  },

  getFeedHint: feeds.getFeedHint,
}
