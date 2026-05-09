import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

export const insanejournalHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'insanejournal.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/data/rss`, hint: composeHint('insanejournal:posts-rss') })
    uris.push({ uri: `${origin}/data/atom`, hint: composeHint('insanejournal:posts-atom') })

    return uris
  },
}
