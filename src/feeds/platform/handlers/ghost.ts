import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Ghost-hosted blogs on `*.ghost.io` serve RSS at `/rss/` and advertise
// the site-level feed via HTML `<link rel="alternate">`, so generic
// discovery finds it. The handler is kept to synthesise the per-tag
// (`/tag/{slug}/rss/`) and per-author (`/author/{slug}/rss/`) feeds,
// which Ghost's Casper theme does not advertise in `<link>` tags even
// though the URLs resolve.

const tagRegex = /^\/tag\/([^/]+)/
const authorRegex = /^\/author\/([^/]+)/

export const ghostHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'ghost.io')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Tag page: /tag/{slug}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      uris.push({
        uri: `${origin}/tag/${tagMatch[1]}/rss/`,
        hint: composeHint('ghost:tag'),
      })
    }

    // Author page: /author/{slug}
    const authorMatch = pathname.match(authorRegex)

    if (authorMatch?.[1]) {
      uris.push({
        uri: `${origin}/author/${authorMatch[1]}/rss/`,
        hint: composeHint('ghost:author'),
      })
    }

    uris.push({ uri: `${origin}/rss/`, hint: composeHint('ghost:blog') })

    return uris
  },
}
