import { naverBlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog.

export type NaverBlogUrl = { kind: 'blog'; blogId: string } | { kind: 'post'; blogId: string }

const feeds = withHintLabels(naverBlog.feeds)

export const parseNaverBlogUrl = (url: string): NaverBlogUrl | undefined => {
  const page = naverBlog.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', blogId: page.values.blogId }
  }

  return { kind: 'blog', blogId: page.values.blogId }
}

export const naverBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseNaverBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNaverBlogUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('blog', { blogId: parsed.blogId }, 'rss'),
      feeds.getFeedEntry('blog', { blogId: parsed.blogId }, 'rdf'),
      feeds.getFeedEntry('blog', { blogId: parsed.blogId }, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
