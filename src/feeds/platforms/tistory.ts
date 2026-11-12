import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TistoryUrl = { kind: 'blog' }

const domains = ['tistory.com']

const feeds = definePlatformFeeds([
  { key: 'tistory:blog', template: '{scheme}://{blog}.tistory.com/rss' },
  { key: 'tistory:blog', template: '{scheme}://{blog}.tistory.com/feed' },
  { key: 'tistory:blog', template: '{scheme}://{blog}.tistory.com/index.xml' },
])

export const parseTistoryUrl = (url: string): TistoryUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const tistoryHandler: PlatformHandler = {
  match: (url) => {
    return parseTistoryUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = getTenantSubdomain(url, domains)

    if (!blog) {
      return []
    }

    const scheme = new URL(url).protocol.slice(0, -1)

    return [feeds.getFeedEntry('tistory:blog', { scheme, blog })]
  },

  getFeedKey: feeds.getFeedKey,
}
