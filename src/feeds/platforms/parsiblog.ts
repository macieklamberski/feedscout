import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ParsiblogUrl = { kind: 'blog'; blog: string }

const domains = ['parsiblog.com', 'parsiblog.ir']

// Parsiblog serves no HTTPS, and a blog serves the same feeds on either domain and on its older
// .aspx paths.
const feeds = definePlatformFeeds(
  'parsiblog',
  [
    {
      key: 'posts',
      main: '{scheme}://{host}/rss/',
      format: 'rss',
      aliases: ['{scheme}://{host}/RSS.aspx', '{scheme}://{host}/Mag/RSS.aspx'],
    },
    {
      key: 'posts',
      main: '{scheme}://{host}/atom/',
      format: 'atom',
      aliases: ['{scheme}://{host}/ATOM.aspx'],
    },
  ],
  { hosts: { tenants: domains }, isWwwTenantPrefix: true },
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

    // Every page, on either domain, links its feeds on {blog}.ParsiBlog.com. Parsiblog serves no
    // HTTPS, so an https page still gets http feeds.
    const params = { scheme: 'http', host: `${parsed.blog}.parsiblog.com` }

    return [page.getFeedEntry('posts', params, 'rss'), page.getFeedEntry('posts', params, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
