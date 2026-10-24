import { getPathSegments, getQueryParam, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: mobile.

export type NaverBlogUrl = { kind: 'blog'; blogId: string } | { kind: 'post'; blogId: string }

export const hosts = ['blog.naver.com', 'm.blog.naver.com']

export const parseNaverBlogUrl = (url: string): NaverBlogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [first, second] = getPathSegments(parsedUrl)

  if (!first) {
    return
  }

  // A dotted segment is a script such as /PostView.naver, which names the blog in its `blogId`
  // query, and /BlogList.naver names none.
  const blogId = first.includes('.') ? getQueryParam(parsedUrl.searchParams, 'blogId') : first

  if (!blogId) {
    return
  }

  // A script page such as /PostView.naver shows a post, as does /{blogId}/{logNo}.
  if (second || first.includes('.')) {
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
      {
        uri: `https://rss.blog.naver.com/${parsed.blogId}.xml`,
        hint: composeHint('naver-blog:blog'),
      },
    ]
  },
}
