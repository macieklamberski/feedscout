import { prlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PrlogUrl = { kind: 'pressroom'; pressroomId: string }

const feeds = withHintLabels(prlog.feeds)

export const parsePrlogUrl = (url: string): PrlogUrl | undefined => {
  const page = prlog.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'pressroom', pressroomId: page.values.pressroomId }
}

export const prlogHandler: PlatformHandler = {
  match: (url) => {
    return parsePrlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = parsePrlogUrl(url)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('press-releases', { pressroomId: page.pressroomId })]
  },

  getFeedHint: feeds.getFeedHint,
}
