import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Postype channel pages carry no `alternate` link. A channel is addressed two
// ways, `postype.com/@{id}` and `{id}.postype.com`, and each has its own feed
// path. The reversed `/rss/@{id}` form is a 404.

const hosts = ['postype.com', 'www.postype.com']
const domainSuffixRegex = /\.postype\.com$/i
const excludedSubdomains = ['www', 'api', 'cdn', 'i', 'blog-cdn']

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { hostname, pathname } = new URL(url)

      if (isHostOf(url, hosts)) {
        const [first] = pathname.split('/').filter(Boolean)

        return first?.startsWith('@') ?? false
      }

      if (!isSubdomainOf(url, 'postype.com')) {
        return false
      }

      return !excludedSubdomains.includes(hostname.replace(domainSuffixRegex, ''))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
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
    } catch {}

    return []
  },
}
