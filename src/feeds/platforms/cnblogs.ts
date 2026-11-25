import { cnblogs } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type CnblogsUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(cnblogs.feeds)

export const parseCnblogsUrl = (url: string): CnblogsUrl | undefined => {
  const page = cnblogs.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.values.username }
}

export const cnblogsHandler: PlatformHandler = {
  match: (url) => {
    return parseCnblogsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCnblogsUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
