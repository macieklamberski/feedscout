import { jellypod } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type JellypodUrl = { kind: 'show' }

const feeds = withHintLabels(jellypod.feeds)

export const parseJellypodUrl = (url: string): JellypodUrl | undefined => {
  if (!jellypod.pages.readUrl(url)) {
    return
  }

  return { kind: 'show' }
}

export const jellypodHandler: PlatformHandler = {
  match: (url) => {
    return parseJellypodUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!page || !parseJellypodUrl(url)) {
      return []
    }

    return [page.getFeedEntry('podcast')]
  },

  getFeedHint: feeds.getFeedHint,
}
