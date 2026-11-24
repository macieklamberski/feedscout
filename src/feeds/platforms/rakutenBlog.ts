import { rakutenBlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RakutenBlogUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(rakutenBlog.feeds)

export const parseRakutenBlogUrl = (url: string): RakutenBlogUrl | undefined => {
  const page = rakutenBlog.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.params.username }
}

export const rakutenBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseRakutenBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRakutenBlogUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
