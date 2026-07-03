import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

export const weblogLolHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'weblog.lol')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rss.xml`, hint: composeHint('weblog-lol:posts-rss') })
    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('weblog-lol:posts-atom') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('weblog-lol:posts-json') })

    return uris
  },
}
