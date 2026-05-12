import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Naver Blog exposes exactly one RSS surface per blog at
// `rss.blog.naver.com/{blogId}.xml`, which the desktop blog page advertises via
// HTML `<link rel="alternate" type="application/rss+xml">`. Mobile pages
// (`m.blog.naver.com`) are SPA shells with no autodiscovery link, so the handler
// is needed to normalise both desktop and mobile URLs onto the off-domain `nfront`
// host and to reject UI pages whose first segment contains a dot
// (e.g. `BlogList.naver`).

const hosts = ['blog.naver.com', 'm.blog.naver.com']

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
