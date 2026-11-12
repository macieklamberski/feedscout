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
    const site = getTenantSubdomain(url, domains)
    const tenantPage = tenantFeeds.forUrl(url)

    // A site with a section turned off answers its feed with 404.
    if (site && tenantPage) {
      return [
        tenantPage.getFeedEntry('nethouse:news', { site }),
        tenantPage.getFeedEntry('nethouse:articles', { site }),
      ]
    }

    const sitePage = siteFeeds.forUrl(url)

    if (!sitePage) {
      return []
    }

    return [sitePage.getFeedEntry('nethouse:news'), sitePage.getFeedEntry('nethouse:articles')]
  },

  getFeedHint: tenantFeeds.getFeedHint,
}
