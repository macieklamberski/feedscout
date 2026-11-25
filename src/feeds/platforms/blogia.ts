import { blogia } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BlogiaUrl = { kind: 'blog'; blog: string }

const feeds = withHintLabels(blogia.feeds)

export const parseBlogiaUrl = (url: string): BlogiaUrl | undefined => {
  const page = blogia.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', blog: page.values.blog }
}

export const blogiaHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogiaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogiaUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts'), page.getFeedEntry('comments')]
  },

  getFeedHint: feeds.getFeedHint,
}
