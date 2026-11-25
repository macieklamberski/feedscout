import { kktix } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: events.

export type KktixUrl = { kind: 'organizer'; organizer: string }

const feeds = withHintLabels(kktix.feeds)

export const parseKktixUrl = (url: string): KktixUrl | undefined => {
  // A nested subdomain like a.b.kktix.cc fails TLS, since the certificate covers one label.
  const page = kktix.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'organizer', organizer: page.values.organizer }
}

export const kktixHandler: PlatformHandler = {
  match: (url) => {
    return parseKktixUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!page || !parseKktixUrl(url)) {
      return []
    }

    return [page.getFeedEntry('events')]
  },

  getFeedHint: feeds.getFeedHint,
}
