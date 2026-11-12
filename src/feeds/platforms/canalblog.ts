import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CanalblogUrl = { kind: 'blog'; blog: string }

const domains = ['canalblog.com']

const feeds = definePlatformFeeds([{ key: 'canalblog:posts', template: '{scheme}://{host}/rss' }], {
  domains,
})

export const parseCanalblogUrl = (url: string): CanalblogUrl | undefined => {
  // A nested subdomain like a.b.canalblog.com fails TLS, since the certificate covers one label.
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const canalblogHandler: PlatformHandler = {
  match: (url) => {
    return parseCanalblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanalblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('canalblog:posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
