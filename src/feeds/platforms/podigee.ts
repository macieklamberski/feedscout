import { podigee } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PodigeeUrl = { kind: 'podcast' }

const feeds = withHintLabels(podigee.feeds)

export const parsePodigeeUrl = (url: string): PodigeeUrl | undefined => {
  if (!podigee.pages.readUrl(url)) {
    return
  }

  return { kind: 'podcast' }
}

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    return parsePodigeeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodigeeUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('podcast')]
  },

  getFeedHint: feeds.getFeedHint,
}
