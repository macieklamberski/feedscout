import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MataroaUrl = { kind: 'blog' }

const domains = ['mataroa.blog']
const excludedSubdomains = ['api', 'cdn', 'static']

export const parseMataroaUrl = (url: string): MataroaUrl | undefined => {
  if (!getTenantSubdomain(url, domains, excludedSubdomains)) {
    return
  }

  return { kind: 'blog' }
}

export const mataroaHandler: PlatformHandler = {
  match: (url) => {
    return parseMataroaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMataroaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss/`, hint: composeHint('mataroa:blog') }]
  },
}
