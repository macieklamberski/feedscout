import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['jimdofree.com']

// A site on its own domain is known only by its header, so its feed is built here but not claimed.
const feeds = definePlatformFeeds([{ key: 'jimdo:blog', template: '{scheme}://{host}/rss/blog' }], {
  domains,
})

// Jimdo Creator answers every page with the site's id in this header, on its own hosts and on
// custom domains alike.
export const isJimdoHeaders = (headers: Headers): boolean => {
  return headers.has('x-jimdo-wid')
}

export const jimdoHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isJimdoHeaders })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('jimdo:blog')]
  },

  // The table reads any host under jimdofree.com, so only a site's own subdomain is claimed, never
  // the apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
