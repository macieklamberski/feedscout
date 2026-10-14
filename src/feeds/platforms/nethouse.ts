import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['nethouse.ru', 'nethouse.me']

export const isNethouseHeaders = (headers: Headers): boolean => {
  return headers.get('x-generator') === 'nethouse'
}

export const nethouseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isSubdomainOf(url, domains)) {
      return getTenantSubdomain(url, domains) !== undefined
    }

    return hasMarker(content, headers, { headers: isNethouseHeaders })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    // A site with a section turned off answers its feed with 404.
    return [
      { uri: `${origin}/posts/rss`, hint: composeHint('nethouse:news') },
      { uri: `${origin}/articles/rss`, hint: composeHint('nethouse:articles') },
    ]
  },
}
