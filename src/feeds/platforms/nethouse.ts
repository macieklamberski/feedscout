import { isAnyOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

const domains = ['nethouse.ru', 'nethouse.me']

// Nethouse's own site, whose feed paths redirect to a 404.
const excludedHosts = ['www.nethouse.ru']

export const isNethouseHeaders = (headers: Headers): boolean => {
  return headers.get('x-generator') === 'nethouse'
}

export const nethouseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isAnyOf(new URL(url).hostname.toLowerCase(), excludedHosts)) {
      return false
    }

    if (isSubdomainOf(url, domains)) {
      return true
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
