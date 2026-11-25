import { ameblo } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts.

export type AmebloUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(ameblo.feeds)

export const parseAmebloUrl = (url: string): AmebloUrl | undefined => {
  const page = ameblo.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.values.username }
}

export const amebloHandler: PlatformHandler = {
  match: (url) => {
    return parseAmebloUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAmebloUrl(url)

    if (!parsed) {
      return []
    }

    const params = { username: parsed.username }

    return [
      feeds.getFeedEntry('posts', params, 'rss'),
      feeds.getFeedEntry('posts', params, 'atom'),
      feeds.getFeedEntry('posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
