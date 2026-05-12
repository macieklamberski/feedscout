import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Posthaven blogs expose a per-blog Atom feed at
// `{sub}.posthaven.com/posts.atom`, advertised on the home page via
// `<link rel="alternate" type="application/atom+xml">`. The handler adds
// the undocumented but live per-tag feed at `/tag/{tag}.atom`, which tag
// pages do not autodiscover (only the global posts feed appears in the
// page head).

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
