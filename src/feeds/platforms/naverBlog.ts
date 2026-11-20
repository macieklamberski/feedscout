import { naverBlog } from 'feedintel'
import { getPathSegments, getQueryParam, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog.

export type NaverBlogUrl = { kind: 'blog'; blogId: string } | { kind: 'post'; blogId: string }

export const hosts = naverBlog.hosts.exact

const feeds = withHintLabels(naverBlog.feeds)

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
