import { teletype } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts.

export type TeletypeUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(teletype.feeds)

export const parseTeletypeUrl = (url: string): TeletypeUrl | undefined => {
  const page = teletype.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.params.username }
}

export const teletypeHandler: PlatformHandler = {
  match: (url) => {
    return parseTeletypeUrl(url) !== undefined
  },

  resolve: (url) => {
    const teletypeUrl = parseTeletypeUrl(url)

    if (!teletypeUrl) {
      return []
    }

    const params = { username: teletypeUrl.username }

    return [feeds.getFeedEntry('posts', params, 'rss'), feeds.getFeedEntry('posts', params, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
