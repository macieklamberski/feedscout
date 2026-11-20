import { canalblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CanalblogUrl = { kind: 'blog' }

const domains = canalblog.hosts.tenants

const feeds = withHintLabels(canalblog.feeds)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
