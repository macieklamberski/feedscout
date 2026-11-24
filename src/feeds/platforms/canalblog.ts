import { canalblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type CanalblogUrl = { kind: 'blog' }

const feeds = withHintLabels(canalblog.feeds)

export const parseCanalblogUrl = (url: string): CanalblogUrl | undefined => {
  if (!canalblog.pages.read(url)) {
    return
  }

  return { kind: 'blog' }
}

export const canalblogHandler: PlatformHandler = {
  match: (url) => {
    return parseCanalblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanalblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
