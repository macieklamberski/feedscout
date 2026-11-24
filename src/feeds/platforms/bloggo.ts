import { bloggo } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BloggoUrl = { kind: 'blog' } | { kind: 'post'; slug: string }
export type BloggoPage = BloggoUrl

const postBodyRegex = /<body[^<>]*\bpost-id-\d+/

const feeds = withHintLabels(bloggo.feeds)

export const parseBloggoUrl = (url: string): BloggoUrl | undefined => {
  const page = bloggo.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', slug: page.params.slug }
  }

  return { kind: 'blog' }
}

export const getBloggoPage = (url: string, content: string | undefined): BloggoPage | undefined => {
  const parsed = parseBloggoUrl(url)

  if (!parsed) {
    return
  }

  // A made-up post answers its comments feed with a 200 placeholder channel, and only a real
  // post page carries a post-id body class.
  if (parsed.kind === 'post' && content && !postBodyRegex.test(content)) {
    return { kind: 'blog' }
  }

  return parsed
}

export const bloggoHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggoUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getBloggoPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    if (page.kind === 'post') {
      return [
        pageFeeds.getFeedEntry('post-comments', { slug: page.slug }),
        pageFeeds.getFeedEntry('posts'),
      ]
    }

    return [pageFeeds.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
