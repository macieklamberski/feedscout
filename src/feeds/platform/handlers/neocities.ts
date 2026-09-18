import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

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
