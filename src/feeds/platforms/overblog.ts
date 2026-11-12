import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OverblogUrl = { kind: 'blog' }

// Overblog's `over-blog.*` country domains, then its other domains.
// length: keeps any suffix but a two-letter country code out
const domains = [
  /^over-blog\.(?:com|net|org|[a-z]{2})$/,
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('overblog:posts')]
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
