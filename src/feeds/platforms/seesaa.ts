import { getRegistrableDomain } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, iiblog, seesaaBlog, seesaaSpace, sokuho, xblog (html), partly covers stablo.

export type SeesaaUrl = { kind: 'blog' }

const domains = [/^(?:seesaa\.(?:net|blog|space)|iiblog\.jp|sokuho\.org|stablo\.jp|xblog\.jp)$/]

const feeds = definePlatformFeeds(
  [
    { key: 'seesaa:posts', template: '{scheme}://{host}/index20.rdf', format: 'rss' },
    { key: 'seesaa:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
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
    const domain = getRegistrableDomain(url)
    const page = feeds.forUrl(url)

    if (!parseSeesaaUrl(url) || !domain || !page) {
      return []
    }

    // The certificate the blogs share leaves out stablo.jp, so its blogs serve feeds over http.
    // The other domains redirect http to https.
    const params = { scheme: domain === 'stablo.jp' ? 'http' : 'https' }

    return [
      page.getFeedEntry('seesaa:posts', params, 'rss'),
      page.getFeedEntry('seesaa:posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
