import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: mobile.

export const hosts = ['blog.naver.com', 'm.blog.naver.com']

export const naverBlogHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const blogId = pathSegments[0]

    if (blogId.includes('.')) {
      return []
    }

    return [
      {
        uri: `https://rss.blog.naver.com/${blogId}.xml`,
        hint: composeHint('naver-blog:blog'),
      },
    ]
  },
}
