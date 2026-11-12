import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggerDeUrl = { kind: 'blog'; blog: string }

const domains = ['blogger.de']

const feeds = definePlatformFeeds([
  { key: 'blogger-de:posts', template: 'https://{blog}.blogger.de/rss' },
  { key: 'blogger-de:posts', template: 'https://{blog}.blogger.de/topics/{topic}/rss' },
])

export const parseBloggerDeUrl = (url: string): BloggerDeUrl | undefined => {
  // A nested subdomain like a.b.blogger.de fails TLS, since the certificate covers one label.
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const bloggerDeHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggerDeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggerDeUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('blogger-de:posts', { blog: parsed.blog })]
  },

  getFeedKey: feeds.getFeedKey,
}
