import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PostachioUrl = { kind: 'site'; subdomain: string }

const domains = ['postach.io']

export const parsePostachioUrl = (url: string): PostachioUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

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
