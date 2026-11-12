import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SakuraBlogUrl = { kind: 'blog'; hostname: string }

const domains = ['sblo.jp']

// Blogs on the classic engine answer over http only, as their alternate links spell it: https fails
// the TLS handshake with a certificate that names blog.sakura.ne.jp. Newer blogs serve https and
// /rss.xml instead, which generic discovery finds through the page's anchor.
const feeds = definePlatformFeeds([
  { key: 'sakura-blog:posts', template: 'http://{blog}.sblo.jp/index20.rdf', format: 'rss' },
  { key: 'sakura-blog:posts', template: 'http://{blog}.sblo.jp/index.rdf', format: 'rdf' },
])

export const parseSakuraBlogUrl = (url: string): SakuraBlogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog', hostname: new URL(url).hostname }
}

export const sakuraBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSakuraBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = getTenantSubdomain(url, domains)

    if (!blog) {
      return []
    }

    return [
      feeds.getFeedEntry('sakura-blog:posts', { blog }, 'rss'),
      feeds.getFeedEntry('sakura-blog:posts', { blog }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
