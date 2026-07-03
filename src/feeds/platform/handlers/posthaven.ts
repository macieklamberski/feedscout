import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

const tagRegex = /^\/tag\/([^/]+)/

export const posthavenHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'posthaven.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Tag page: /tag/{tag} — Posthaven serves an undocumented per-tag Atom feed.
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      uris.push({
        uri: `${origin}/tag/${tagMatch[1]}.atom`,
        hint: composeHint('posthaven:tag'),
      })
    }

    uris.push({ uri: `${origin}/posts.atom`, hint: composeHint('posthaven:posts') })

    return uris
  },
}
