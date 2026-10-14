import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggerDeUrl = { kind: 'blog'; blog: string }

const domains = ['blogger.de']

const excludedSubdomains = ['cdn']

export const parseBloggerDeUrl = (url: string): BloggerDeUrl | undefined => {
  // A nested subdomain like a.b.blogger.de fails TLS, since the certificate covers one label.
  const blog = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const bloggerDeHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggerDeUrl(url) !== undefined
  },

  resolve: (url) => {
    if (!parseBloggerDeUrl(url)) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('blogger-de:posts') }]
  },
}
