import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TistoryUrl = { kind: 'blog' }

const domains = ['tistory.com']

const feeds = definePlatformFeeds(
  'tistory',
  [
    {
      key: 'blog',
      main: '{scheme}://{host}/rss',
      aliases: ['{scheme}://{host}/feed', '{scheme}://{host}/index.xml'],
    },
  ],
  { hosts: { tenants: domains } },
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

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
