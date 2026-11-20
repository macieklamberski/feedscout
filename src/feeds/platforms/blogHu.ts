import { blogHu } from 'feedintel'
import { decodePercent, isHostOf, parseUrl } from 'trousse'
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
const hosts = blogHu.hosts.exact

const userRegex = /^\/user\/(\d+)(?:\/|$)/i
const postRegex = /^\/(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\/(?<slug>[^/]+)\/?$/
const tagRegex = /^\/tags\/([^/]+)\/?$/i

const feeds = withHintLabels(blogHu.feeds)

export const parseBlogHuUrl = (url: string): BlogHuUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const userId = parsedUrl.pathname.match(userRegex)?.[1]

    if (userId) {
      return { kind: 'user', userId }
    }

    return
  }

  const blog = getTenantSubdomain(parsedUrl, domains)

  if (!blog) {
    return
  }

  // A post page, /{year}/{month}/{day}/{slug}, links its comments feed. A tag page, /tags/{tag},
  // has a feed of the posts with that tag.
  const post = parsedUrl.pathname.match(postRegex)?.groups
  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (post?.year && post.month && post.day && post.slug) {
    return {
      kind: 'blog',
      blog,
      post: { year: post.year, month: post.month, day: post.day, slug: decodePercent(post.slug) },
    }
  }

  if (tag) {
    return { kind: 'blog', blog, tag: decodePercent(tag) }
  }

  return { kind: 'blog', blog }
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
