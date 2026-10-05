import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JellypodUrl = { kind: 'show' }

const domains = ['jellypod.com']

// Jellypod's own services, not shows.
const excludedSubdomains = [
  'admin',
  'api',
  'app',
  'blog',
  'dashboard',
  'docs',
  'go',
  'help',
  'login',
  'mcp',
  'oauth',
  'preview',
  'share',
  'studio',
  'support',
  'team',
  'try',
  'www',
]

export const parseJellypodUrl = (url: string): JellypodUrl | undefined => {
  const slug = getSubdomain(url, domains)

  if (!slug || isAnyOf(slug, excludedSubdomains)) {
    return
  }

  return { kind: 'show' }
}

export const jellypodHandler: PlatformHandler = {
  match: (url) => {
    return parseJellypodUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseJellypodUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/rss`,
        hint: composeHint('jellypod:podcast'),
      },
    ]
  },
}
