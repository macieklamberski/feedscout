import { getRegistrableDomain } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, iiblog, seesaaBlog, seesaaSpace, sokuho, xblog (html), partly covers stablo.

export type SeesaaUrl = { kind: 'blog' }

const domains = [
  'seesaa.net',
  'iiblog.jp',
  'seesaa.blog',
  'seesaa.space',
  'sokuho.org',
  'stablo.jp',
  'xblog.jp',
]

// A blog with a podcast also serves its RSS feed as `index_custom.rdf`.
const feeds = definePlatformFeeds(
  [
    { key: 'seesaa:posts', template: '{scheme}://{blog}.{domain}/index20.rdf', format: 'rss' },
    { key: 'seesaa:posts', template: '{scheme}://{blog}.{domain}/index.rdf', format: 'rdf' },
    {
      key: 'seesaa:posts',
      template: '{scheme}://{blog}.{domain}/index_custom.rdf',
      format: 'rss',
    },
  ],
  { domains },
)

export const parseSeesaaUrl = (url: string): SeesaaUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const seesaaHandler: PlatformHandler = {
  match: (url) => {
    return parseSeesaaUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = getTenantSubdomain(url, domains)
    const domain = getRegistrableDomain(url)

    if (!blog || !domain) {
      return []
    }

    const params = { scheme: new URL(url).protocol.slice(0, -1), blog, domain }

    return [
      feeds.getFeedEntry('seesaa:posts', params, 'rss'),
      feeds.getFeedEntry('seesaa:posts', params, 'rdf'),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
