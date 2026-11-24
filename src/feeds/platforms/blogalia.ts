import { blogalia } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type BlogaliaUrl = { kind: 'blog' }

const feeds = withHintLabels(blogalia.feeds)

export const parseBlogaliaUrl = (url: string): BlogaliaUrl | undefined => {
  if (!blogalia.pages.read(url)) {
    return
  }

  return { kind: 'blog' }
}

export const blogaliaHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogaliaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogaliaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts', {}, 'rdf'), page.getFeedEntry('posts', {}, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
