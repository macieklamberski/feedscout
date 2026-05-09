import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

export const seesaaHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'seesaa.net')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/index20.rdf`, hint: composeHint('seesaa:posts-rss2') })
    uris.push({ uri: `${origin}/index.rdf`, hint: composeHint('seesaa:posts-rdf') })

    return uris
  },
}
