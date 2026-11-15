import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ReformalUrl = { kind: 'project' }

const domains = ['reformal.ru', 'idea.informer.com']

// A project serves the same feed with an `ia` idea id in the query, which the table reads as an
// extra parameter.
const feeds = definePlatformFeeds(
  [{ key: 'reformal:feedback', template: '{scheme}://{host}/proj/rss' }],
  { domains },
)

export const parseReformalUrl = (url: string): ReformalUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'project' }
}

export const reformalHandler: PlatformHandler = {
  match: (url) => {
    return parseReformalUrl(url) !== undefined
  },

  resolve: (url) => {
    const pageFeeds = feeds.forUrl(url)

    if (!parseReformalUrl(url) || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('reformal:feedback')]
  },

  getFeedHint: feeds.getFeedHint,
}
