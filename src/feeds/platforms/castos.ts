import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CastosUrl = { kind: 'show'; slug: string }

const domains = ['castos.com']

// The feed id is opaque, so it is read from the feed link every show page carries.
const feedIdRegex = /https:\/\/feeds\.castos\.com\/([a-z0-9]+)/i

// Castos's own services, not shows.
const excludedSubdomains = [
  'api',
  'app',
  'assets',
  'cdn',
  'feeds',
  'help',
  'images-cdn',
  'player',
  'status',
  'support',
  'www',
]

export const parseCastosUrl = (url: string): CastosUrl | undefined => {
  const slug = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!slug) {
    return
  }

  return { kind: 'show', slug }
}

export const castosHandler: PlatformHandler = {
  match: (url) => {
    return parseCastosUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseCastosUrl(url)

    if (!parsed) {
      return []
    }

    const feedId = content?.match(feedIdRegex)?.[1]

    if (feedId) {
      return [
        {
          uri: `https://feeds.castos.com/${feedId}`,
          hint: composeHint('castos:podcast'),
        },
      ]
    }

    // The show site redirects /feed to its feeds.castos.com URL.
    return [
      {
        uri: `https://${parsed.slug}.castos.com/feed`,
        hint: composeHint('castos:podcast'),
      },
    ]
  },
}
