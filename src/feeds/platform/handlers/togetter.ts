import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Togetter serves a per-curator feed at `/rss/id/{user}` and a popular feed at
// `/rss/hot`. Curator and article pages carry no `alternate` link, and without
// the handler a curator page resolves to the site-wide feed instead of theirs.
//
// The `/rss/{name}` namespace is not open: `/rss/new` is a 404.

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
