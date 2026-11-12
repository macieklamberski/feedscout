import { getRegistrableDomain } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HashnodeUrl = { kind: 'blog' }

const domains = ['hashnode.dev', 'hashnode.com']

const feeds = definePlatformFeeds(
  [{ key: 'hashnode:blog', template: 'https://{blog}.{domain}/rss.xml' }],
  { domains },
)

export const parseHashnodeUrl = (url: string): HashnodeUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const hashnodeHandler: PlatformHandler = {
  match: (url) => {
    return parseHashnodeUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = getTenantSubdomain(url, domains)
    const domain = getRegistrableDomain(url)

    if (!blog || !domain) {
      return []
    }

    return [feeds.getFeedEntry('hashnode:blog', { blog, domain })]
  },

  getFeedKey: feeds.getFeedKey,
}
