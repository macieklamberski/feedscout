import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['castos.com']

// The feed id is opaque, so it is read from the feed link every show page carries.
const feedIdRegex = /https:\/\/feeds\.castos\.com\/([a-z0-9]+)/i

// Castos's own services, not shows.
const reservedSlugs = [
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

export const castosHandler: PlatformHandler = {
  match: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return false
    }

    return !isAnyOf(slug, reservedSlugs)
  },

  resolve: (url, content) => {
    const feedId = content?.match(feedIdRegex)?.[1]

    if (feedId) {
      return [
        {
          uri: `https://feeds.castos.com/${feedId}`,
          hint: composeHint('castos:podcast'),
        },
      ]
    }

    const slug = getSubdomain(url, domains)

    if (!slug) {
      return []
    }

    // The show site redirects /feed to its feeds.castos.com URL.
    return [
      {
        uri: `https://${slug}.castos.com/feed`,
        hint: composeHint('castos:podcast'),
      },
    ]
  },
}
