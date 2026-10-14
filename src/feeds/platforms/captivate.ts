import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CaptivateUrl = { kind: 'show'; slug: string }

const domains = ['captivate.fm']

// Captivate's own services, not shows.
const excludedSubdomains = [
  'api',
  'artwork',
  'assets',
  'cdn',
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

export const parseCaptivateUrl = (url: string): CaptivateUrl | undefined => {
  const slug = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!slug) {
    return
  }

  return { kind: 'show', slug }
}

export const captivateHandler: PlatformHandler = {
  match: (url) => {
    return parseCaptivateUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCaptivateUrl(url)

    if (!parsed) {
      return []
    }

    // The feed URL without the trailing slash answers 301.
    return [
      {
        uri: `https://feeds.captivate.fm/${parsed.slug}/`,
        hint: composeHint('captivate:podcast'),
      },
    ]
  },
}
