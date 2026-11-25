import { parsiblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParsiblogUrl = { kind: 'blog'; blog: string }

const feeds = withHintLabels(parsiblog.feeds)

export const parseParsiblogUrl = (url: string): ParsiblogUrl | undefined => {
  const page = parsiblog.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', blog: page.values.blog }
}

export const parsiblogHandler: PlatformHandler = {
  match: (url) => {
    return parseParsiblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParsiblogUrl(url)

    if (!parsed) {
      return []
    }

    const params = { blog: parsed.blog }

    return [feeds.getFeedEntry('posts', params, 'rss'), feeds.getFeedEntry('posts', params, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
