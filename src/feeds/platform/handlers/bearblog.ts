import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Partially discoverable without handler.

export const bearblogHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'bearblog.dev')
  },

  resolve: (url) => {
    const { origin, searchParams } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Tag filter via ?q= query param.
    const tag = searchParams.get('q')

    if (tag) {
      uris.push({
        uri: `${origin}/feed/?q=${encodeURIComponent(tag)}`,
        hint: composeHint('bearblog:tag-atom'),
      })
      uris.push({
        uri: `${origin}/feed/?type=rss&q=${encodeURIComponent(tag)}`,
        hint: composeHint('bearblog:tag-rss'),
      })
    }

    uris.push({ uri: `${origin}/feed/`, hint: composeHint('bearblog:posts-atom') })
    uris.push({ uri: `${origin}/feed/?type=rss`, hint: composeHint('bearblog:posts-rss') })

    return uris
  },
}
