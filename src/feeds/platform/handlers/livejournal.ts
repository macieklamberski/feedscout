import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

export const livejournalHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'livejournal.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/data/rss`, hint: composeHint('livejournal:posts-rss') })
    uris.push({ uri: `${origin}/data/atom`, hint: composeHint('livejournal:posts-atom') })

    return uris
  },
}
