import { decodePercent, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, post-comments, posts.
// Handler needed for: tag, user.

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
  'blog-hu',
  [
    {
      key: 'posts',
      main: '{scheme}://{host}/rss2',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss', '{scheme}://{host}/xml/rss2'],
    },
    { key: 'posts', main: '{scheme}://{host}/atom', format: 'atom' },
    {
      key: 'comments',
      main: '{scheme}://{host}/comments/rss2',
      format: 'rss',
      aliases: [
        '{scheme}://{host}/comments/rss',
        '{scheme}://{host}/comments/comments/rss',
        '{scheme}://{host}/comments/comments/rss2',
      ],
    },
    { key: 'comments', main: '{scheme}://{host}/comments/atom', format: 'atom' },
    {
      key: 'post-comments',
      main: '{scheme}://{host}/{year}/{month}/{day}/{slug}/rss2',
      format: 'rss',
    },
    {
      key: 'post-comments',
      main: '{scheme}://{host}/{year}/{month}/{day}/{slug}/atom',
      format: 'atom',
    },
    { key: 'tag', main: '{scheme}://{host}/rss/tags/{tag}', format: 'rss' },
    { key: 'tag', main: '{scheme}://{host}/atom/tags/{tag}', format: 'atom' },
    // A user feed with a `token` query is the same feed signed for one reader.
    { key: 'user', main: 'https://blog.hu/user/{userId}/rss' },
  ],
  { hosts: { tenants: domains } },
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
