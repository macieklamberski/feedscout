import { isAnyOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['weebly.com']
const numericRegex = /^\d+$/

export const weeblyHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)
    const uris: Array<DiscoverUriEntry> = []

    // Custom blog page slug (e.g., /articles/feed when page is named "articles").
    const firstSegment = pathSegments[0]

    if (firstSegment && !isAnyOf(firstSegment, 'blog') && !numericRegex.test(firstSegment)) {
      uris.push({
        uri: `${origin}/${firstSegment}/feed`,
        hint: composeHint('weebly:blog'),
      })
    }

    uris.push({ uri: `${origin}/blog/feed`, hint: composeHint('weebly:blog') })

    return uris
  },
}
