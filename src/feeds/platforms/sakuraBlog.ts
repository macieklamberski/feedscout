import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SakuraBlogUrl = { kind: 'blog'; hostname: string }

const domains = ['sblo.jp']

const feeds = definePlatformFeeds(
  [
    { key: 'sakura-blog:posts', template: '{scheme}://{host}/index20.rdf', format: 'rss' },
    { key: 'sakura-blog:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
    // A blog made since the platform's redesign serves its posts at `/rss.xml` alone, and an older
    // blog answers 404 there.
    { key: 'sakura-blog:redesign-posts', template: '{scheme}://{host}/rss.xml', format: 'rss' },
  ],
  { domains, isWwwTenantPrefix: true },
)

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
    const page = feeds.forUrl(url)

    if (!parseSakuraBlogUrl(url) || !page) {
      return []
    }

    // Blogs on the classic engine answer over http only, as their alternate links spell it: https
    // fails the TLS handshake with a certificate that names blog.sakura.ne.jp. Newer blogs serve
    // https and redirect http there.
    return [
      page.getFeedEntry('sakura-blog:posts', { scheme: 'http' }, 'rss'),
      page.getFeedEntry('sakura-blog:posts', { scheme: 'http' }, 'rdf'),
      page.getFeedEntry('sakura-blog:redesign-posts', undefined, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
