import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PagecordUrl = { kind: 'blog'; blog: string }

const domains = ['pagecord.com']

const feeds = definePlatformFeeds([
  { key: 'pagecord:blog', template: 'https://{blog}.pagecord.com/feed.xml' },
  { key: 'pagecord:blog', template: 'https://{blog}.pagecord.com/feed' },
  { key: 'pagecord:blog', template: 'https://{blog}.pagecord.com/feed.rss' },
])

export const parsePagecordUrl = (url: string): PagecordUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return parsePagecordUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePagecordUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('pagecord:blog', { blog: parsed.blog })]
  },

  getFeedHint: feeds.getFeedHint,
}
