import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

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
