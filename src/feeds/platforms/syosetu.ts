import { syosetu } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: activity.
// Handler needed for: all-novels, author.

export type SyosetuUrl = { kind: 'writer'; writerId: string }

const feeds = withHintLabels(syosetu.feeds)

export const parseSyosetuUrl = (url: string): SyosetuUrl | undefined => {
  const page = syosetu.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'writer', writerId: page.params.writerId }
}

export const syosetuHandler: PlatformHandler = {
  match: (url) => {
    return parseSyosetuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSyosetuUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('author', { writerId: parsed.writerId }),
      feeds.getFeedEntry('activity', { writerId: parsed.writerId }),
      feeds.getFeedEntry('all-novels'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
