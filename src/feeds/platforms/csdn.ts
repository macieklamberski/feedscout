import { csdn } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: blog.

export type CsdnUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(csdn.feeds)

export const parseCsdnUrl = (url: string): CsdnUrl | undefined => {
  const page = csdn.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.values.username }
}

export const csdnHandler: PlatformHandler = {
  match: (url) => {
    return parseCsdnUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCsdnUrl(url)

    if (!parsed) {
      return []
    }

    const { username } = parsed

    return [feeds.getFeedEntry('blog', { username })]
  },

  getFeedHint: feeds.getFeedHint,
}
