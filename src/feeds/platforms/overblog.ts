import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OverblogUrl = { kind: 'blog' }

const domains = [
  'over-blog.com',
  'over-blog.de',
  'over-blog.es',
  'over-blog.fr',
  'over-blog.it',
  'over-blog.net',
  'over-blog.org',
  'over.blog',
  'overblog.com',
  'overblog.fr',
]

const feeds = definePlatformFeeds([{ key: 'overblog:posts', template: '{scheme}://{host}/rss' }], {
  domains,
})

export const parseOverblogUrl = (url: string): OverblogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const overblogHandler: PlatformHandler = {
  match: (url) => {
    return parseOverblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOverblogUrl(url)

    if (!parsed) {
      return []
    }

    const { protocol, host } = new URL(url)

    return [feeds.getFeedEntry('overblog:posts', { scheme: protocol.slice(0, -1), host })]
  },

  // The table reads any host under the domains, so the page parser refuses the apex and the www
  // host first, whose /rss ends in a 404, and a www or nested subdomain of a blog.
  getFeedHint: (url) => {
    if (!parseOverblogUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
