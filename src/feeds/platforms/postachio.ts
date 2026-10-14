import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PostachioUrl = { kind: 'site'; subdomain: string }

const domains = ['postach.io']

const excludedSubdomains = ['api', 'blog', 'cdn-images', 'cdn-static']

export const parsePostachioUrl = (url: string): PostachioUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!subdomain) {
    return
  }

  return { kind: 'site', subdomain }
}

export const postachioHandler: PlatformHandler = {
  match: (url) => {
    return parsePostachioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePostachioUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://${parsed.subdomain}.postach.io/feed.xml`,
        hint: composeHint('postachio:posts'),
      },
    ]
  },
}
