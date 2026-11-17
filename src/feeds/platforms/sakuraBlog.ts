import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SakuraBlogUrl = { kind: 'blog'; hostname: string }

const domains = ['sblo.jp']

const feeds = definePlatformFeeds(
  'sakura-blog',
  [
    {
      key: 'posts',
      main: '{scheme}://{host}/index20.rdf',
      format: 'rss',
      aliases: [
        // A blog made since the platform's redesign serves its posts at `/rss.xml` alone, and an
        // older blog answers 404 there. It is built under the page's own origin, since a newer blog
        // serves https and redirects http there.
        '{root}/rss.xml',
      ],
    },
    { key: 'posts', main: '{scheme}://{host}/index.rdf', format: 'rdf' },
  ],
  { hosts: { tenants: domains }, isWwwTenantPrefix: true },
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
    // fails the TLS handshake with a certificate that names blog.sakura.ne.jp.
    return [
      page.getFeedSpellings('posts', { scheme: 'http' }, 'rss'),
      page.getFeedEntry('posts', { scheme: 'http' }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
