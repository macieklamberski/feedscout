import { getPathSegments, getQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: mobile.

export type NaverBlogUrl = { kind: 'blog'; blogId: string } | { kind: 'post'; blogId: string }

export const hosts = ['blog.naver.com', 'm.blog.naver.com']

// The feed host serves feeds only, so it stays out of `hosts` and its pages are not read as blogs.
const feeds = definePlatformFeeds([
  { key: 'naver-blog:blog', template: 'https://rss.blog.naver.com/{blogId}.xml' },
])

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

    return [feeds.getFeedEntry('naver-blog:blog', { blogId: parsed.blogId })]
  },

  getFeedHint: feeds.getFeedHint,
}
