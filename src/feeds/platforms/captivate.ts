import { captivate } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: podcast.
// Handler needed for: latest.

export type CaptivateUrl = { kind: 'show'; slug: string }

const domains = captivate.hosts.tenants

const feeds = withHintLabels(captivate.feeds)

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

    return [
      feeds.getFeedEntry('podcast', { slug: parsed.slug }),
      feeds.getFeedEntry('latest', { slug: parsed.slug }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
