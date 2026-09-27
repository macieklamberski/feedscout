import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['captivate.fm']

// Captivate's own services, not shows.
const reservedSlugs = [
  'api',
  'artwork',
  'assets',
  'docs',
  'feeds',
  'help',
  'media',
  'my',
  'player',
  'podcasts',
  'status',
  'www',
]

export const captivateHandler: PlatformHandler = {
  match: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return false
    }

    return !isAnyOf(slug, reservedSlugs)
  },

  resolve: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return []
    }

    // The feed URL without the trailing slash answers 301.
    return [
      {
        uri: `https://feeds.captivate.fm/${slug}/`,
        hint: composeHint('captivate:podcast'),
      },
    ]
  },
}
