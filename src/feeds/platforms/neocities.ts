import { getSubdomain, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const domains = ['neocities.org']
const hosts = ['neocities.org', 'www.neocities.org']

const getUsername = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const segments = pathname.split('/').filter(Boolean)

  if (isSubdomainOf(url, domains)) {
    return getSubdomain(url, domains)
  }

  if (isHostOf(url, hosts) && segments[0] === 'site') {
    return segments[1]
  }
}

export const neocitiesHandler: PlatformHandler = {
  match: (url) => {
    return Boolean(getUsername(url))
  },

  resolve: (url) => {
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
  },
}
