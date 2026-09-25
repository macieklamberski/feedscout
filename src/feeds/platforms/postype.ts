import { isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile (html).
// Handler needed for: subdomain.

export const hosts = ['postype.com', 'www.postype.com']
const domainSuffixRegex = /\.postype\.com$/i
const excludedSubdomains = ['www', 'api', 'cdn', 'i', 'blog-cdn']

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { hostname, pathname } = parsedUrl

    if (isHostOf(url, hosts)) {
      const [first] = pathname.split('/').filter(Boolean)

      return first?.startsWith('@') ?? false
    }

    if (!isSubdomainOf(url, 'postype.com')) {
      return false
    }

    return !excludedSubdomains.includes(hostname.replace(domainSuffixRegex, ''))
  },

  resolve: (url) => {
    const { origin, hostname, pathname } = new URL(url)

    if (isHostOf(url, hosts)) {
      const [first] = pathname.split('/').filter(Boolean)

      if (!first?.startsWith('@') || first.length < 2) {
        return []
      }

      return [
        {
          uri: `https://www.postype.com/${first}/rss`,
          hint: composeHint('postype:posts'),
        },
      ]
    }

    if (!isSubdomainOf(url, 'postype.com')) {
      return []
    }

    if (excludedSubdomains.includes(hostname.replace(domainSuffixRegex, ''))) {
      return []
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('postype:posts') }]
  },
}
