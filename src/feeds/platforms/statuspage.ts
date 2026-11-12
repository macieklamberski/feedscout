import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['statuspage.io']

// A status page on its own domain is known only by its markers, so its feeds are built here but
// not claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'statuspage:history', template: '{scheme}://{host}/history.rss', format: 'rss' },
    { key: 'statuspage:history', template: '{scheme}://{host}/history.atom', format: 'atom' },
  ],
  { domains },
)

export const isStatuspageHtml = (content: string): boolean => {
  return content.includes('dka575ofm4ao0.cloudfront.net/packs/')
}

export const isStatuspageHeaders = (headers: Headers): boolean => {
  return headers.has('x-statuspage-version')
}

export const statuspageHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isStatuspageHtml, headers: isStatuspageHeaders })
  },

  // Every page of a status page, an incident included, advertises the page's incident history.
  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [
      page.getFeedEntry('statuspage:history', {}, 'rss'),
      page.getFeedEntry('statuspage:history', {}, 'atom'),
    ]
  },

  // The table reads any host under statuspage.io, so only a page's own subdomain is claimed, never
  // the apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
