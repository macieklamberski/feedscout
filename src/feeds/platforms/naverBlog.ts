import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: mobile.

export type NaverBlogUrl = { kind: 'blog'; blogId: string }

export const hosts = ['blog.naver.com', 'm.blog.naver.com']

export const parseNaverBlogUrl = (url: string): NaverBlogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [blogId] = getPathSegments(parsedUrl)

  // Excludes dots to skip pages like /BlogList.naver.
  if (!blogId || blogId.includes('.')) {
    return
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
