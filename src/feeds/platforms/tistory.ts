import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TistoryUrl = { kind: 'blog' }

const domains = ['tistory.com']

const feeds = definePlatformFeeds(
  [
    { key: 'tistory:blog', template: '{scheme}://{host}/rss' },
    { key: 'tistory:blog', template: '{scheme}://{host}/feed', isAlias: true },
    { key: 'tistory:blog', template: '{scheme}://{host}/index.xml', isAlias: true },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parseTistoryUrl(url) || !page) {
      return []
    }

    return [page.getFeedEntry('tistory:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
