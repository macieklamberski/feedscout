import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Matches *.blogspot.com and country TLDs like *.blogspot.co.uk, *.blogspot.de, etc.
const blogspotDomainPattern = /^.+\.blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2,3})$/
const labelPattern = /^\/search\/label\/([^/]+)/

export const blogspotHandler: PlatformHandler = {
  match: (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase()

      return blogspotDomainPattern.test(hostname)
    } catch {}

    return false
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Label page: /search/label/{label}
    const labelMatch = pathname.match(labelPattern)

    if (labelMatch?.[1]) {
      const label = labelMatch[1]

      uris.push({
        uri: `${origin}/feeds/posts/default/-/${label}`,
        hint: composeHint('blogspot:label'),
      })
    }

    // Always include main blog feeds.
    uris.push({
      uri: `${origin}/feeds/posts/default`,
      hint: composeHint('blogspot:posts-atom'),
    })
    uris.push({
      uri: `${origin}/feeds/posts/default?alt=rss`,
      hint: composeHint('blogspot:posts-rss'),
    })

    return uris
  },
}
