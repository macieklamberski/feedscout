import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CaptivateUrl = { kind: 'show'; slug: string }

const domains = ['captivate.fm']

export const parseCaptivateUrl = (url: string): CaptivateUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

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
