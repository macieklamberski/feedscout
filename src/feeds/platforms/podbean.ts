import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodbeanUrl = { kind: 'podcast'; show: string }

const domains = ['podbean.com']

// A missed entry builds feed.podbean.com/{name}/feed.xml, a real but unrelated show.
const excludedSubdomains = ['feed', 'pbcdn1', 'sponsorship', 'podads', 'help', 'blog', 'support']

export const parsePodbeanUrl = (url: string): PodbeanUrl | undefined => {
  const show = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!show) {
    return
  }

  return { kind: 'podcast', show }
}

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    return parsePodbeanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodbeanUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://feed.podbean.com/${parsed.show}/feed.xml`,
        hint: composeHint('podbean:podcast'),
      },
    ]
  },
}
