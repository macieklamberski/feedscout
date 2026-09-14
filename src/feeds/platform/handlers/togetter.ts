import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['togetter.com', 'www.togetter.com']
const curatorPathRegex = /^\/id\/([^/]+)/

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const curator = pathname.match(curatorPathRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (curator) {
        uris.push({
          uri: `${origin}/rss/id/${curator}`,
          hint: composeHint('togetter:curator'),
        })
      }

      uris.push({ uri: `${origin}/rss/hot`, hint: composeHint('togetter:hot') })

      return uris
    } catch {}

    return []
  },
}
