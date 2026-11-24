import { reformal } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ReformalUrl = { kind: 'project' }

const feeds = withHintLabels(reformal.feeds)

export const parseReformalUrl = (url: string): ReformalUrl | undefined => {
  if (!reformal.pages.read(url)) {
    return
  }

  return { kind: 'project' }
}

export const reformalHandler: PlatformHandler = {
  match: (url) => {
    return parseReformalUrl(url) !== undefined
  },

  resolve: (url) => {
    const pageFeeds = feeds.forUrl(url)

    if (!parseReformalUrl(url) || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('feedback')]
  },

  getFeedHint: feeds.getFeedHint,
}
