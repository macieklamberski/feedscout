import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ParsiblogUrl = { kind: 'blog'; blog: string }

const domains = ['parsiblog.com', 'parsiblog.ir']

// Parsiblog serves no HTTPS, and a blog serves the same feeds on either domain and on its older
// .aspx paths.
const feeds = definePlatformFeeds(
  [
    { key: 'parsiblog:posts', template: 'http://{blog}.{domain}/rss/', format: 'rss' },
    { key: 'parsiblog:posts', template: 'http://{blog}.{domain}/atom/', format: 'atom' },
    { key: 'parsiblog:posts', template: 'http://{blog}.{domain}/RSS.aspx', format: 'rss' },
    { key: 'parsiblog:posts', template: 'http://{blog}.{domain}/ATOM.aspx', format: 'atom' },
    { key: 'parsiblog:posts', template: 'http://{blog}.{domain}/Mag/RSS.aspx', format: 'rss' },
  ],
  { domains },
)

export const parseParsiblogUrl = (url: string): ParsiblogUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const parsiblogHandler: PlatformHandler = {
  match: (url) => {
    return parseParsiblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParsiblogUrl(url)

    if (!parsed) {
      return []
    }

    // Every page, on either domain, links its feeds on http://{blog}.ParsiBlog.com.
    const params = { blog: parsed.blog, domain: 'parsiblog.com' }

    return [
      feeds.getFeedEntry('parsiblog:posts', params, 'rss'),
      feeds.getFeedEntry('parsiblog:posts', params, 'atom'),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
