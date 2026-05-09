import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Partially discoverable without handler.

export const dreamwidthHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'dreamwidth.org')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/data/rss`, hint: composeHint('dreamwidth:posts-rss') })
    uris.push({ uri: `${origin}/data/atom`, hint: composeHint('dreamwidth:posts-atom') })

    return uris
  },
}
