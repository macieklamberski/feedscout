import { isSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['nethouse.ru', 'nethouse.me']

const tenantFeeds = definePlatformFeeds(
  [
    { key: 'nethouse:news', template: 'https://{site}.{domain}/posts/rss' },
    { key: 'nethouse:articles', template: 'https://{site}.{domain}/articles/rss' },
  ],
  { domains },
)

// A site on its own domain is known only by its markers, so its feeds are built but not claimed.
const siteFeeds = definePlatformFeeds(
  [
    { key: 'nethouse:news', template: '{scheme}://{host}/posts/rss' },
    { key: 'nethouse:articles', template: '{scheme}://{host}/articles/rss' },
  ],
  { domains },
)

export const isNethouseHeaders = (headers: Headers): boolean => {
  return headers.get('x-generator') === 'nethouse'
}

export const nethouseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isSubdomainOf(url, domains)) {
      return getTenantSubdomain(url, domains) !== undefined
    }

    return hasMarker(content, headers, { headers: isNethouseHeaders })
  },

  resolve: (url) => {
    const { protocol, hostname, host } = new URL(url)
    const site = getTenantSubdomain(url, domains)

    // A site with a section turned off answers its feed with 404.
    if (site) {
      const params = { site, domain: hostname.slice(site.length + 1) }

      return [
        tenantFeeds.getFeedEntry('nethouse:news', params),
        tenantFeeds.getFeedEntry('nethouse:articles', params),
      ]
    }

    const params = { scheme: protocol.slice(0, -1), host }

    return [
      siteFeeds.getFeedEntry('nethouse:news', params),
      siteFeeds.getFeedEntry('nethouse:articles', params),
    ]
  },

  getFeedHint: tenantFeeds.getFeedHint,
}
