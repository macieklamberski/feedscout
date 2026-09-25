import { getSubdomain, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'fireside.fm')
  },

  resolve: (url) => {
    const slug = getSubdomain(url, 'fireside.fm')

    if (!slug) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://feeds.fireside.fm/${slug}/rss`,
      hint: composeHint('fireside:podcast', 'rss'),
    })
    uris.push({
      uri: `https://${slug}.fireside.fm/json`,
      hint: composeHint('fireside:podcast', 'json'),
    })

    return uris
  },
}
