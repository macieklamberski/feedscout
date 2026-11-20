import { bluesky } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BlueskyUrl = { kind: 'profile'; handle: string }

const feeds = withHintLabels(bluesky.feeds)

export const parseBlueskyUrl = (url: string): BlueskyUrl | undefined => {
  const page = bluesky.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'profile', handle: page.params.handle }
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return parseBlueskyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlueskyUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('posts', { handle: parsed.handle })]
  },

  getFeedHint: feeds.getFeedHint,
}
