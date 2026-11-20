import { blogHu } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, post-comments, posts.
// Handler needed for: tag, user.

export type BlogHuUrl =
  | { kind: 'blog'; blog: string; post?: BlogHuPost; tag?: string }
  | { kind: 'user'; userId: string }

export type BlogHuPost = { year: string; month: string; day: string; slug: string }

const domains = blogHu.hosts.tenants

const feeds = withHintLabels(blogHu.feeds)

export const parseBlogHuUrl = (url: string): BlogHuUrl | undefined => {
  const page = blogHu.pages.read(url)

  if (!page) {
    return
  }

  const { userId, year, month, day, slug, tag } = page.params

  if (page.key === 'user') {
    return { kind: 'user', userId }
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  // A post page links its comments feed. A tag page has a feed of the posts with that tag.
  if (slug) {
    return { kind: 'blog', blog, post: { year, month, day, slug } }
  }

  return { kind: 'blog', blog, tag }
}

export const blogHuHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogHuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogHuUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('user', { userId: parsed.userId })]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.post) {
      return [
        page.getFeedEntry('post-comments', parsed.post, 'rss'),
        page.getFeedEntry('post-comments', parsed.post, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('comments', {}, 'rss'),
        page.getFeedEntry('comments', {}, 'atom'),
      ]
    }

    if (parsed.tag) {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag }, 'rss'),
        page.getFeedEntry('tag', { tag: parsed.tag }, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('comments', {}, 'rss'),
        page.getFeedEntry('comments', {}, 'atom'),
      ]
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'atom'),
      page.getFeedEntry('comments', {}, 'rss'),
      page.getFeedEntry('comments', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
