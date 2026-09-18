import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Neither a Neocities site nor its profile page links a feed, and the feed sits
// on a different host than the site: `{user}.neocities.org` is served from
// `neocities.org/site/{user}.rss`. It lists file updates, not posts.
//
// A site on a custom domain answers with `server: neocities` but carries no
// username anywhere, so it stays unmatched: there is nothing to build a feed
// URL from.

const hosts = ['neocities.org', 'www.neocities.org']
const domainSuffixRegex = /\.neocities\.org$/i

const getUsername = (url: string): string | undefined => {
  const { hostname, pathname } = new URL(url)
  const segments = pathname.split('/').filter(Boolean)

  if (isSubdomainOf(url, 'neocities.org')) {
    return hostname.replace(domainSuffixRegex, '')
  }

  if (isHostOf(url, hosts) && segments[0] === 'site') {
    return segments[1]
  }
}

export const neocitiesHandler: PlatformHandler = {
  match: (url) => {
    try {
      return Boolean(getUsername(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const username = getUsername(url)

      if (!username) {
        return []
      }

      return [
        {
          uri: `https://neocities.org/site/${username}.rss`,
          hint: composeHint('neocities:updates'),
        },
      ]
    } catch {}

    return []
  },
}
