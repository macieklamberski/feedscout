import { canpan } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type CanpanUrl = { kind: 'blog'; blog: string }

const feeds = withHintLabels(canpan.feeds)

export const parseCanpanUrl = (url: string): CanpanUrl | undefined => {
  const page = canpan.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', blog: page.values.blog }
}

export const canpanHandler: PlatformHandler = {
  match: (url) => {
    return parseCanpanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanpanUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('posts', { blog: parsed.blog }, 'rss'),
      feeds.getFeedEntry('posts', { blog: parsed.blog }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
