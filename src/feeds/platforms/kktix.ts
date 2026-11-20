import { kktix } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: events.

export type KktixUrl = { kind: 'organizer'; organizer: string }

const domains = kktix.hosts.tenants

const feeds = withHintLabels(kktix.feeds)

export const parseKktixUrl = (url: string): KktixUrl | undefined => {
  // A nested subdomain like a.b.kktix.cc fails TLS, since the certificate covers one label.
  const organizer = getTenantSubdomain(url, domains)

  if (!organizer) {
    return
  }

  return { kind: 'organizer', organizer }
}

export const kktixHandler: PlatformHandler = {
  match: (url) => {
    return parseKktixUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page || !parseKktixUrl(url)) {
      return []
    }

    return [page.getFeedEntry('events')]
  },

  getFeedHint: feeds.getFeedHint,
}
