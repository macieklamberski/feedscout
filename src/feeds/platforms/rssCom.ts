import { rssCom } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RssComUrl = { kind: 'podcast'; show: string }

const feeds = withHintLabels(rssCom.feeds)

export const parseRssComUrl = (url: string): RssComUrl | undefined => {
  const page = rssCom.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'podcast', show: page.values.show }
}

export const rssComHandler: PlatformHandler = {
  match: (url) => {
    return parseRssComUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRssComUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { show: parsed.show })]
  },

  getFeedHint: feeds.getFeedHint,
}
