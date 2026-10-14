import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FiresideUrl = { kind: 'podcast'; slug: string }

const domains = ['fireside.fm']

const excludedSubdomains = [
  'app',
  'assets',
  'blog',
  'cdn',
  'feeds',
  'help',
  'media',
  'static',
  'status',
  'www',
]

export const parseFiresideUrl = (url: string): FiresideUrl | undefined => {
  const slug = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!slug) {
    return
  }

  return { kind: 'podcast', slug }
}

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return parseFiresideUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFiresideUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://feeds.fireside.fm/${parsed.slug}/rss`,
        hint: composeHint('fireside:podcast', 'rss'),
      },
      {
        uri: `https://${parsed.slug}.fireside.fm/json`,
        hint: composeHint('fireside:podcast', 'json'),
      },
    ]
  },
}
