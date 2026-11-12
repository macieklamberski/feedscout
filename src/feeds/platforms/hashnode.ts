import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HashnodeUrl = { kind: 'blog' }

const domains = ['hashnode.dev', 'hashnode.com']

const feeds = definePlatformFeeds(
  [{ key: 'hashnode:blog', template: '{scheme}://{host}/rss.xml' }],
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
    const page = feeds.forUrl(url)

    if (!parseHashnodeUrl(url) || !page) {
      return []
    }

    return [page.getFeedEntry('hashnode:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
