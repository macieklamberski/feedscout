import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'

// Matches *.blogspot.com and country TLDs like *.blogspot.co.uk, *.blogspot.de, etc.
const blogspotDomainRegex = /^.+\.blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2,3})$/

export const blogspotHandler: PlatformHandler = {
  match: (url) => {
    const hostname = new URL(url).hostname.toLowerCase()

    return blogspotDomainRegex.test(hostname)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Label page: /search/label/{label}
    const labelMatch = pathname.match(/^\/search\/label\/([^/]+)/)

    if (labelMatch?.[1]) {
      const label = labelMatch[1]

      uris.push({
        uri: `${origin}/feeds/posts/default/-/${label}`,
        hint: { key: 'blogspot:label', label: 'Label' },
      })
    }

    // Always include main blog feeds.
    uris.push({
      uri: `${origin}/feeds/posts/default`,
      hint: { key: 'blogspot:posts-atom', label: 'Posts (Atom)' },
    })
    uris.push({
      uri: `${origin}/feeds/posts/default?alt=rss`,
      hint: { key: 'blogspot:posts-rss', label: 'Posts (RSS)' },
    })

    return uris
  },
}
