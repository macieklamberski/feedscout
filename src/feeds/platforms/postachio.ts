import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PostachioUrl = { kind: 'site'; subdomain: string }

const domains = ['postach.io']

// Postach.io's own services, served off the blog farm's address.
const excludedSubdomains = ['api', 'blog', 'cdn-images', 'cdn-static', 'www']

export const parsePostachioUrl = (url: string): PostachioUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (!subdomain || isAnyOf(subdomain, excludedSubdomains)) {
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
