import { isSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['nethouse.ru', 'nethouse.me']

const feeds = definePlatformFeeds(
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
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    // A site with a section turned off answers its feed with 404.
    return [page.getFeedEntry('nethouse:news'), page.getFeedEntry('nethouse:articles')]
  },

  getFeedHint: feeds.getFeedHint,
}
