import { velog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: posts, trending.

export type VelogUrl = { kind: 'user'; username: string } | { kind: 'home' }

const feeds = withHintLabels(velog.feeds)

export const parseVelogUrl = (url: string): VelogUrl | undefined => {
  const page = velog.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.values.username }
  }

  return { kind: 'home' }
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return parseVelogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseVelogUrl(url)

    if (!parsed) {
      return []
    }

    // The trending feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('posts', { username: parsed.username }),
        feeds.getFeedEntry('trending'),
      ]
    }

    return [feeds.getFeedEntry('trending')]
  },

  getFeedHint: feeds.getFeedHint,
}
