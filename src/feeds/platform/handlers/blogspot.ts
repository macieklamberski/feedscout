import type { PlatformHandler } from '../../../common/uris/platform/types.js'

// Matches *.blogspot.com and country TLDs like *.blogspot.co.uk, *.blogspot.de, etc.
const blogspotDomainRegex = /^.+\.blogspot\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2,3})$/

export const blogspotHandler: PlatformHandler = {
  match: (url) => {
    const hostname = new URL(url).hostname.toLowerCase()

    return blogspotDomainRegex.test(hostname)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feeds/posts/default`, `${origin}/feeds/posts/default?alt=rss`]
  },
}
