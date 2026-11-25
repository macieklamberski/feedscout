import { livedoorBlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type LivedoorBlogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const feeds = withHintLabels(livedoorBlog.feeds)

export const parseLivedoorBlogUrl = (url: string): LivedoorBlogUrl | undefined => {
  const page = livedoorBlog.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', blog: page.values.blog, category: page.values.category }
  }

  return { kind: 'blog', blog: page.values.blog }
}

export const livedoorBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseLivedoorBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLivedoorBlogUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { category: parsed.category }, 'rdf'),
        page.getFeedEntry('posts', {}, 'rdf'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'rdf'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
