import { getPathSegments, getQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog.

export type NaverBlogUrl = { kind: 'blog'; blogId: string } | { kind: 'post'; blogId: string }

export const hosts = ['blog.naver.com', 'm.blog.naver.com']

// The feed host serves feeds only, so it stays out of `hosts` and its pages are not read as blogs.
// The bare path and the old `blogRss.nhn` script serve the same items as `.xml`, and each serves
// RSS 1.0 under `rss=1.0` and Atom under `atom=0.3`. The `.xml` path is the one blog pages link.
const feeds = definePlatformFeeds('naver-blog', [
  {
    key: 'blog',
    main: 'https://rss.blog.naver.com/{blogId}.xml',
    format: 'rss',
    aliases: [
      'https://rss.blog.naver.com/{blogId}',
      'https://rss.blog.naver.com/rss/blogRss.nhn?blogId={blogId}',
    ],
  },
  {
    key: 'blog',
    main: 'https://rss.blog.naver.com/{blogId}.xml?rss=1.0',
    format: 'rdf',
    aliases: [
      'https://rss.blog.naver.com/{blogId}?rss=1.0',
      'https://rss.blog.naver.com/rss/blogRss.nhn?blogId={blogId}&rss=1.0',
    ],
  },
  {
    key: 'blog',
    main: 'https://rss.blog.naver.com/{blogId}.xml?atom=0.3',
    format: 'atom',
    aliases: [
      'https://rss.blog.naver.com/{blogId}?atom=0.3',
      'https://rss.blog.naver.com/rss/blogRss.nhn?atom=0.3&blogId={blogId}',
    ],
  },
])

// A blog id carries no dot, so a file on the feed host such as `/robots.txt` is no blog's feed.
const feedHostFileRegex = /^\/[^/]*\.(?!xml\/?$)[^/]*\/?$/i

export const parseNaverBlogUrl = (url: string): NaverBlogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [blogIdOrScript, logNo] = getPathSegments(parsedUrl)

  if (!blogIdOrScript) {
    return
  }

  // A dotted segment is a script such as /PostView.naver, which names the blog in its `blogId`
  // query, and /BlogList.naver names none.
  const blogId = blogIdOrScript.includes('.')
    ? getQueryParam(parsedUrl.searchParams, 'blogId')
    : blogIdOrScript

  if (!blogId) {
    return
  }

  // A script page such as /PostView.naver shows a post, as does /{blogId}/{logNo}.
  if (logNo || blogIdOrScript.includes('.')) {
    return { kind: 'post', blogId }
  }

  return { kind: 'blog', blogId }
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

  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || feedHostFileRegex.test(parsedUrl.pathname)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
