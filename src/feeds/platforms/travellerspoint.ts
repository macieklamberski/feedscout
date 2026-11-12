import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TravellerspointUrl = { kind: 'blog'; blog: string }

const domains = ['travellerspoint.com']

const feeds = definePlatformFeeds([
  { key: 'travellerspoint:posts', template: 'https://{blog}.travellerspoint.com/atom.xml' },
  { key: 'travellerspoint:posts', template: 'https://{blog}.travellerspoint.com/rss.xml' },
])

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
    const parsed = parseTravellerspointUrl(url)

    if (!parsed) {
      return []
    }

    // An http page redirects to https, and the page's alternate link spells the feed with https.
    return [feeds.getFeedEntry('travellerspoint:posts', { blog: parsed.blog })]
  },

  getFeedKey: feeds.getFeedKey,
}
