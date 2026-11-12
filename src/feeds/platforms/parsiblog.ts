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
    { key: 'parsiblog:posts', template: '{scheme}://{host}/rss/', format: 'rss' },
    { key: 'parsiblog:posts', template: '{scheme}://{host}/atom/', format: 'atom' },
    { key: 'parsiblog:posts', template: '{scheme}://{host}/RSS.aspx', format: 'rss' },
    { key: 'parsiblog:posts', template: '{scheme}://{host}/ATOM.aspx', format: 'atom' },
    { key: 'parsiblog:posts', template: '{scheme}://{host}/Mag/RSS.aspx', format: 'rss' },
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // Every page, on either domain, links its feeds on {blog}.ParsiBlog.com.
    const params = { host: `${parsed.blog}.parsiblog.com` }

    return [
      page.getFeedEntry('parsiblog:posts', params, 'rss'),
      page.getFeedEntry('parsiblog:posts', params, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
