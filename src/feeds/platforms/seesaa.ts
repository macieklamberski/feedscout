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

const feeds = definePlatformFeeds(
  [
    { key: 'seesaa:posts', template: '{scheme}://{blog}.{domain}/index20.rdf', format: 'rss' },
    { key: 'seesaa:posts', template: '{scheme}://{blog}.{domain}/index.rdf', format: 'rdf' },
    // The podcast feed. A blog that never set one up mostly answers 404, and few pages link it, so
    // the row only claims it.
    { key: 'seesaa:podcast', template: '{scheme}://{blog}.{domain}/index_custom.rdf' },
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

    // The certificate the blogs share leaves out stablo.jp, so its blogs serve feeds over http.
    // The other domains redirect http to https.
    const params = { scheme: domain === 'stablo.jp' ? 'http' : 'https', blog, domain }

    return [
      feeds.getFeedEntry('seesaa:posts', params, 'rss'),
      feeds.getFeedEntry('seesaa:posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
