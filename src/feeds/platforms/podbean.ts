import { podbean } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: podcast.
// Handler needed for: latest.

export type PodbeanUrl = { kind: 'podcast'; show: string }

const feeds = withHintLabels(podbean.feeds)

export const parsePodbeanUrl = (url: string): PodbeanUrl | undefined => {
  const page = podbean.pages.readUrl(url)

  if (page?.key !== 'podcast') {
    return
  }

  return { kind: 'podcast', show: page.values.show }
}

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    return parsePodbeanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodbeanUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('podcast', { show: parsed.show }),
      feeds.getFeedEntry('latest', { show: parsed.show }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
