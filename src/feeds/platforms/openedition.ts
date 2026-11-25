import { openedition } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: documents, issues.
// Handler needed for: reviews.

export type OpeneditionUrl = { kind: 'journal'; journal: string }

const feeds = withHintLabels(openedition.feeds)

export const parseOpeneditionUrl = (url: string): OpeneditionUrl | undefined => {
  const page = openedition.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'journal', journal: page.values.journal }
}

export const openeditionHandler: PlatformHandler = {
  match: (url) => {
    return parseOpeneditionUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOpeneditionUrl(url)

    if (!parsed) {
      return []
    }

    const params = { journal: parsed.journal }

    return [
      feeds.getFeedEntry('documents', params),
      feeds.getFeedEntry('issues', params),
      feeds.getFeedEntry('reviews', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
