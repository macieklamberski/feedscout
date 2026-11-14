import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PagecordUrl = { kind: 'blog' }

const domains = ['pagecord.com']

const feeds = definePlatformFeeds(
  [
    { key: 'pagecord:blog', template: '{scheme}://{host}/feed.xml' },
    { key: 'pagecord:blog', template: '{scheme}://{host}/feed' },
    { key: 'pagecord:blog', template: '{scheme}://{host}/feed.rss' },
  ],
  { domains },
)

export const parsePagecordUrl = (url: string): PagecordUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return parsePagecordUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePagecordUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('pagecord:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
