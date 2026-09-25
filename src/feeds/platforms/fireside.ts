import { getSubdomain, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['fireside.fm']

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const slug = getSubdomain(url, domains)

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
