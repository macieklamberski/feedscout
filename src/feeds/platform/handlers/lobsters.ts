import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['lobste.rs']
const tagPathRegex = /^\/t\/([a-zA-Z0-9,_-]+)/
const domainPathRegex = /^\/domains\/([^/]+)/

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const uris: Array<string> = []

    // Tag page: /t/{tag} or /t/{tag1},{tag2}
    const tagMatch = pathname.match(tagPathRegex)

    if (tagMatch?.[1]) {
      const tags = tagMatch[1]

      return [`https://lobste.rs/t/${tags}.rss`]
    }

    // Domain page: /domains/{domain}
    const domainMatch = pathname.match(domainPathRegex)

    if (domainMatch?.[1]) {
      const domain = domainMatch[1]

      return [`https://lobste.rs/domains/${domain}.rss`]
    }

    // Newest page.
    if (pathname === '/newest' || pathname === '/newest/') {
      return ['https://lobste.rs/newest.rss']
    }

    // Homepage or other pages - return main feed.
    uris.push('https://lobste.rs/rss')

    return uris
  },
}
