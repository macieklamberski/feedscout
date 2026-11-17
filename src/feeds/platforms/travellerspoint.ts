import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TravellerspointUrl = { kind: 'blog'; blog: string }

const domains = ['travellerspoint.com']

const feeds = definePlatformFeeds(
  'travellerspoint',
  [
    {
      key: 'posts',
      main: '{scheme}://{host}/atom.xml',
      aliases: ['{scheme}://{host}/rss.xml'],
    },
  ],
  { hosts: { tenants: domains } },
)

export const parseTravellerspointUrl = (url: string): TravellerspointUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const travellerspointHandler: PlatformHandler = {
  match: (url) => {
    return parseTravellerspointUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!parseTravellerspointUrl(url) || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
