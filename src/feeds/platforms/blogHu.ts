import { decodePercent, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: user.

export type BlogHuUrl =
  | { kind: 'blog'; blog: string; post?: BlogHuPost; tag?: string }
  | { kind: 'user'; userId: string }

export type BlogHuPost = { year: string; month: string; day: string; slug: string }

const domains = ['blog.hu']
const hosts = ['blog.hu', 'www.blog.hu']

const userRegex = /^\/user\/(\d+)(?:\/|$)/i
const postRegex = /^\/(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\/(?<slug>[^/]+)\/?$/
const tagRegex = /^\/tags\/([^/]+)\/?$/i
const postFeedSegmentRegex = /\/(?:rss2|atom)\/?$/i

// Blogs serve `/rss`, `/comments/rss`, `/comments/comments/rss` and `/comments/comments/rss2` with
// the items of the `rss2` feeds their pages link.
const feeds = definePlatformFeeds(
  [
    { key: 'blog-hu:posts', template: '{scheme}://{host}/rss2', format: 'rss' },
    { key: 'blog-hu:posts', template: '{scheme}://{host}/rss', format: 'rss' },
    { key: 'blog-hu:posts', template: '{scheme}://{host}/xml/rss2', format: 'rss' },
    { key: 'blog-hu:posts', template: '{scheme}://{host}/atom', format: 'atom' },
    { key: 'blog-hu:comments', template: '{scheme}://{host}/comments/rss2', format: 'rss' },
    { key: 'blog-hu:comments', template: '{scheme}://{host}/comments/rss', format: 'rss' },
    {
      key: 'blog-hu:comments',
      template: '{scheme}://{host}/comments/comments/rss',
      format: 'rss',
    },
    {
      key: 'blog-hu:comments',
      template: '{scheme}://{host}/comments/comments/rss2',
      format: 'rss',
    },
    { key: 'blog-hu:comments', template: '{scheme}://{host}/comments/atom', format: 'atom' },
    {
      key: 'blog-hu:post-comments',
      template: '{scheme}://{host}/{year}/{month}/{day}/{slug}/rss2',
      format: 'rss',
    },
    {
      key: 'blog-hu:post-comments',
      template: '{scheme}://{host}/{year}/{month}/{day}/{slug}/atom',
      format: 'atom',
    },
    { key: 'blog-hu:tag', template: '{scheme}://{host}/rss/tags/{tag}', format: 'rss' },
    { key: 'blog-hu:tag', template: '{scheme}://{host}/atom/tags/{tag}', format: 'atom' },
    // A user feed with a `token` query is the same feed signed for one reader.
    { key: 'blog-hu:user', template: 'https://blog.hu/user/{userId}/rss' },
  ],
  { domains },
)

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
      return [feeds.getFeedEntry('blog-hu:user', { userId: parsed.userId })]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.post) {
      return [
        page.getFeedEntry('blog-hu:post-comments', parsed.post, 'rss'),
        page.getFeedEntry('blog-hu:post-comments', parsed.post, 'atom'),
        page.getFeedEntry('blog-hu:posts', {}, 'rss'),
        page.getFeedEntry('blog-hu:posts', {}, 'atom'),
        page.getFeedEntry('blog-hu:comments', {}, 'rss'),
        page.getFeedEntry('blog-hu:comments', {}, 'atom'),
      ]
    }

    if (parsed.tag) {
      return [
        page.getFeedEntry('blog-hu:tag', { tag: parsed.tag }, 'rss'),
        page.getFeedEntry('blog-hu:tag', { tag: parsed.tag }, 'atom'),
        page.getFeedEntry('blog-hu:posts', {}, 'rss'),
        page.getFeedEntry('blog-hu:posts', {}, 'atom'),
        page.getFeedEntry('blog-hu:comments', {}, 'rss'),
        page.getFeedEntry('blog-hu:comments', {}, 'atom'),
      ]
    }

    return [
      page.getFeedEntry('blog-hu:posts', {}, 'rss'),
      page.getFeedEntry('blog-hu:posts', {}, 'atom'),
      page.getFeedEntry('blog-hu:comments', {}, 'rss'),
      page.getFeedEntry('blog-hu:comments', {}, 'atom'),
    ]
  },

  // The table reads any four segments before `/rss2` or `/atom` as a post, so a post comments feed
  // is claimed only under a dated post path.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key !== 'blog-hu:post-comments') {
      return hint
    }

    const postPath = parseUrl(url)?.pathname.replace(postFeedSegmentRegex, '') ?? ''

    if (!postRegex.test(postPath)) {
      return
    }

    return hint
  },
}
