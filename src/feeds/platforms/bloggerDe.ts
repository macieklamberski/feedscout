import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggerDeUrl = { kind: 'blog'; blog: string }

const domains = ['blogger.de']

const feeds = definePlatformFeeds(
  [
    { key: 'blogger-de:posts', template: '{scheme}://{host}/rss' },
    { key: 'blogger-de:posts', template: '{scheme}://{host}/topics/{topic}/rss' },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('blogger-de:posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
