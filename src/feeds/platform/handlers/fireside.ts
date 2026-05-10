import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Partially discoverable without handler.

const domainSuffix = /\.fireside\.fm$/i

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'fireside.fm')
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const slug = hostname.replace(domainSuffix, '')
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://feeds.fireside.fm/${slug}/rss`,
      hint: composeHint('fireside:podcast-rss'),
    })
    uris.push({
      uri: `https://${slug}.fireside.fm/json`,
      hint: composeHint('fireside:podcast-json'),
    })

    return uris
  },
}
