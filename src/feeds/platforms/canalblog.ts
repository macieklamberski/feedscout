import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CanalblogUrl = { kind: 'blog' }

const domains = ['canalblog.com']

export const parseCanalblogUrl = (url: string): CanalblogUrl | undefined => {
  // A nested subdomain like a.b.canalblog.com fails TLS, since the certificate covers one label.
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const canalblogHandler: PlatformHandler = {
  match: (url) => {
    return parseCanalblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanalblogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('canalblog:posts') }]
  },
}
