import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JellypodUrl = { kind: 'show' }

const domains = ['jellypod.com']

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
]

export const parseJellypodUrl = (url: string): JellypodUrl | undefined => {
  if (!getTenantSubdomain(url, domains, excludedSubdomains)) {
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
