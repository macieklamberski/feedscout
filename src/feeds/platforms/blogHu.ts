import { hasQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: user.

export type BlogHuUrl = { kind: 'blog'; blog: string } | { kind: 'user'; userId: string }

const domains = ['blog.hu']
const hosts = ['blog.hu', 'www.blog.hu']

const userRegex = /^\/user\/(\d+)(?:\/|$)/i

// Blogs serve `/rss`, `/comments/rss`, `/comments/comments/rss` and `/comments/comments/rss2` with
// the items of the `rss2` feeds their pages link.
const feeds = definePlatformFeeds([
  { key: 'blog-hu:posts', template: '{scheme}://{blog}.blog.hu/rss2', format: 'rss' },
  { key: 'blog-hu:posts', template: '{scheme}://{blog}.blog.hu/rss', format: 'rss' },
  { key: 'blog-hu:posts', template: '{scheme}://{blog}.blog.hu/atom', format: 'atom' },
  { key: 'blog-hu:comments', template: '{scheme}://{blog}.blog.hu/comments/rss2', format: 'rss' },
  { key: 'blog-hu:comments', template: '{scheme}://{blog}.blog.hu/comments/rss', format: 'rss' },
  {
    key: 'blog-hu:comments',
    template: '{scheme}://{blog}.blog.hu/comments/comments/rss',
    format: 'rss',
  },
  {
    key: 'blog-hu:comments',
    template: '{scheme}://{blog}.blog.hu/comments/comments/rss2',
    format: 'rss',
  },
  { key: 'blog-hu:comments', template: '{scheme}://{blog}.blog.hu/comments/atom', format: 'atom' },
  { key: 'blog-hu:user', template: 'https://blog.hu/user/{userId}/rss' },
])

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
      return [feeds.getFeedEntry('blog-hu:user', { userId: parsed.userId })]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    const params = { blog: parsed.blog }

    return [
      page.getFeedEntry('blog-hu:posts', params, 'rss'),
      page.getFeedEntry('blog-hu:posts', params, 'atom'),
      page.getFeedEntry('blog-hu:comments', params, 'rss'),
      page.getFeedEntry('blog-hu:comments', params, 'atom'),
    ]
  },

  // A user feed with a `token` query is signed for one reader, so it stays unclaimed.
  getFeedHint: (url) => {
    if (hasQueryParam(parseUrl(url), 'token')) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
