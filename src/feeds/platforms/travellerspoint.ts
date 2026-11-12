import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TravellerspointUrl = { kind: 'blog'; blog: string }

const domains = ['travellerspoint.com']

const feeds = definePlatformFeeds(
  [
    { key: 'travellerspoint:posts', template: '{scheme}://{host}/atom.xml' },
    { key: 'travellerspoint:posts', template: '{scheme}://{host}/rss.xml' },
  ],
  { domains },
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

    return [page.getFeedEntry('travellerspoint:posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
